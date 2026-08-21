import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Cotacao, ConfiguracoesAgencia, OpcaoVoo, CATEGORIAS_SERVICO } from '@/types/cotacao'
import { cotacoesService, configAgenciaService } from '@/services/cotacoesService'
import {
  formatarMoeda,
  formatarData,
  calcularDuracaoDias,
  calcularOpcaoVoo,
  encontrarIndiceOpcaoMaisBarata,
} from '@/lib/calculos'
import { extrairOpcoesVoo } from '@/lib/geradorDocumento'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MapPin,
  Calendar,
  Users,
  Plane,
  Building2,
  CheckCircle2,
  Sparkles,
  DollarSign,
  ChevronDown,
  ArrowRight,
  ShieldAlert,
  Clock,
  MessageCircle,
  FileText,
  Share2,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'

function sanitizarNumeroWhatsApp(tel?: string): string {
  if (!tel) return ''
  const apenasDigitos = tel.replace(/\D/g, '')
  if (!apenasDigitos) return ''
  if (apenasDigitos.length === 10 || apenasDigitos.length === 11) {
    return `55${apenasDigitos}`
  }
  return apenasDigitos
}

export default function CotacaoPublica() {
  const { codigo } = useParams<{ codigo: string }>()
  const [carregando, setCarregando] = useState(true)
  const [cotacao, setCotacao] = useState<Cotacao | null>(null)
  const [configAgencia, setConfigAgencia] = useState<ConfiguracoesAgencia | null>(null)
  const [cardsAbertos, setCardsAbertos] = useState<Record<number, boolean>>({})
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    let ativo = true
    async function carregar() {
      if (!codigo) {
        setCarregando(false)
        return
      }

      setCarregando(true)
      try {
        const [cot, cfg] = await Promise.all([
          cotacoesService.buscarPorCodigo(codigo),
          configAgenciaService.obter(),
        ])

        if (!ativo) return

        if (cot && (cot.publica === undefined || cot.publica === true)) {
          setCotacao(cot)
          setConfigAgencia(cfg)

          // Inicializar estado dos cards de voo:
          // Se houver múltiplas opções, abre a mais barata ou a primeira
          const opcoes = extrairOpcoesVoo(cot, cfg)
          const idxMaisBarata = encontrarIndiceOpcaoMaisBarata(opcoes)
          const estadoInicial: Record<number, boolean> = {}
          opcoes.forEach((_, i) => {
            estadoInicial[i] =
              opcoes.length > 1 ? i === idxMaisBarata || (idxMaisBarata === -1 && i === 0) : true
          })
          setCardsAbertos(estadoInicial)
        } else {
          setCotacao(null)
          setConfigAgencia(cfg)
        }
      } catch (err) {
        console.error('Erro ao buscar cotação pública:', err)
        if (ativo) {
          setCotacao(null)
        }
      } finally {
        if (ativo) {
          setCarregando(false)
        }
      }
    }

    carregar()
    return () => {
      ativo = false
    }
  }, [codigo])

  const toggleCard = (index: number) => {
    setCardsAbertos((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const handleCopiarLink = () => {
    const link = window.location.href
    navigator.clipboard.writeText(link)
    setCopiado(true)
    toast.success('Link da cotação copiado!')
    setTimeout(() => setCopiado(false), 2500)
  }

  // Estado de Carregamento
  if (carregando) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800">Carregando Proposta de Viagem...</h2>
            <p className="text-xs text-slate-500">
              Estamos localizando os dados atualizados da sua cotação.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Estado de Cotação Não Encontrada ou Desativada
  if (!cotacao) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full text-center space-y-5">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              Acesso Indisponível
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Cotação não encontrada ou indisponível
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              A proposta com o código <strong>{codigo || 'informado'}</strong> pode ter expirado,
              sido removida ou está com o compartilhamento público desativado pelo consultor.
            </p>
          </div>

          {configAgencia && (configAgencia.whatsapp || configAgencia.telefone_contato) && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <p className="text-xs text-slate-500">
                Entre em contato com <strong>{configAgencia.nome_agencia || 'a agência'}</strong>{' '}
                para solicitar uma nova proposta:
              </p>
              <a
                href={`https://wa.me/${sanitizarNumeroWhatsApp(configAgencia.whatsapp || configAgencia.telefone_contato)}?text=${encodeURIComponent(`Olá! Gostaria de consultar sobre a proposta ${codigo || ''}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-md transition"
              >
                <MessageCircle className="w-4 h-4" />
                Falar com a Agência no WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>
    )
  }

  const agencia = configAgencia || {
    nome_agencia: 'Agência de Viagens',
    margem_padrao: 15,
    imposto_lucro_padrao: 6,
  }

  const opcoesVoo = extrairOpcoesVoo(cotacao, agencia)
  const indiceMaisBarata = encontrarIndiceOpcaoMaisBarata(opcoesVoo)
  const temMultiplasOpcoes = opcoesVoo.length > 1
  const duracao = calcularDuracaoDias(cotacao.data_ida, cotacao.data_volta)
  const totalPassageiros = (cotacao.num_passageiros || 1) + (cotacao.num_criancas || 0)
  const numPassageiros = cotacao.num_passageiros || 1

  const whatsappAgencia =
    sanitizarNumeroWhatsApp(agencia.whatsapp) || sanitizarNumeroWhatsApp(agencia.telefone_contato)

  const msgGeral = `Olá! Gostaria de conversar sobre a proposta de viagem #${cotacao.codigo} para ${cotacao.destino}.`
  const linkWhatsAppGeral = whatsappAgencia
    ? `https://wa.me/${whatsappAgencia}?text=${encodeURIComponent(msgGeral)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(msgGeral)}`

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 py-6 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Barra Flutuante de Compartilhamento / Info */}
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span className="text-slate-600 truncate">
              Proposta comercial oficial de <strong>{agencia.nome_agencia}</strong>
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopiarLink}
            className="h-7 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 border-slate-300 flex-shrink-0"
          >
            {copiado ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Copiado!
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Copiar Link
              </>
            )}
          </Button>
        </div>

        {/* Card Principal da Proposta */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <header className="p-6 sm:p-8 border-b-2 border-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
            <div>
              {agencia.logo_url ? (
                <img
                  src={agencia.logo_url}
                  alt={agencia.nome_agencia}
                  className="max-h-14 max-w-[220px] object-contain mb-2"
                />
              ) : (
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-900 to-slate-900 flex items-center justify-center text-white font-black text-xl shadow-md">
                    ✈
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {agencia.nome_agencia || 'Agência de Viagens'}
                  </span>
                </div>
              )}
              <p className="text-xs text-slate-500">
                {agencia.cnpj_cadastur && `${agencia.cnpj_cadastur} • `}
                {agencia.email_contato || ''}
              </p>
            </div>

            <div className="text-left sm:text-right w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 space-y-1">
              <span className="inline-block bg-slate-900 text-white px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">
                Proposta Comercial
              </span>
              <div className="text-base sm:text-lg font-black font-mono text-slate-900">
                {cotacao.codigo}
              </div>
              <div className="text-xs text-slate-500">
                Emitida em: {formatarData(cotacao.created || new Date().toISOString())}
              </div>
            </div>
          </header>

          <main className="p-6 sm:p-8 space-y-8">
            {/* Hero Banner do Destino */}
            <section className="rounded-2xl bg-gradient-to-r from-slate-950 via-sky-950 to-sky-900 text-white p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-widest text-sky-300 font-bold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> Destino da Viagem
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {cotacao.destino}
                </h1>
                <div className="text-sm text-sky-100 flex items-center gap-2 pt-1 font-medium flex-wrap">
                  <Calendar className="w-4 h-4 text-sky-300" />
                  <span>
                    {formatarData(cotacao.data_ida)} até {formatarData(cotacao.data_volta)}
                    {duracao
                      ? ` • (${duracao} dias / ${duracao > 1 ? duracao - 1 : 1} noites)`
                      : ''}
                  </span>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 sm:text-right w-full sm:w-auto min-w-[190px]">
                <div className="text-xs uppercase tracking-wider text-sky-200 font-bold">
                  Viajantes
                </div>
                <div className="text-xl font-black text-white mt-1">
                  {cotacao.num_passageiros} {cotacao.num_passageiros > 1 ? 'Adultos' : 'Adulto'}
                  {cotacao.num_criancas > 0 ? ` + ${cotacao.num_criancas} Criança(s)` : ''}
                </div>
                <div className="text-xs text-sky-200 mt-0.5">
                  Total: {totalPassageiros} pessoa(s)
                </div>
              </div>
            </section>

            {/* Informações: Cliente & Agência */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
                <div className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
                  <Users className="w-4 h-4 text-sky-700" />
                  <span>Passageiro Responsável</span>
                </div>
                <div className="text-sm font-bold text-slate-900">{cotacao.cliente_nome}</div>
                {cotacao.cliente_telefone && (
                  <div className="text-xs text-slate-600">
                    <strong className="text-slate-700">WhatsApp / Tel:</strong>{' '}
                    {cotacao.cliente_telefone}
                  </div>
                )}
                {cotacao.cliente_email && (
                  <div className="text-xs text-slate-600">
                    <strong className="text-slate-700">E-mail:</strong> {cotacao.cliente_email}
                  </div>
                )}
                {cotacao.cliente_cpf_passaporte && (
                  <div className="text-xs text-slate-600">
                    <strong className="text-slate-700">Documento:</strong>{' '}
                    {cotacao.cliente_cpf_passaporte}
                  </div>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
                <div className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
                  <Building2 className="w-4 h-4 text-sky-700" />
                  <span>Consultoria Responsável</span>
                </div>
                <div className="text-sm font-bold text-slate-900">{agencia.nome_agencia}</div>
                {(agencia.telefone_contato || agencia.whatsapp) && (
                  <div className="text-xs text-slate-600">
                    <strong className="text-slate-700">Contato:</strong>{' '}
                    {agencia.telefone_contato || agencia.whatsapp}
                  </div>
                )}
                {agencia.site_instagram && (
                  <div className="text-xs text-slate-600">
                    <strong className="text-slate-700">Canais:</strong> {agencia.site_instagram}
                  </div>
                )}
              </div>
            </section>

            {/* SEÇÃO: OPÇÕES DE VOO (ACCORDION INTERATIVO) */}
            <section className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Plane className="w-4 h-4 text-sky-700" />
                  <span>Opções de Voo Disponíveis ({opcoesVoo.length})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {temMultiplasOpcoes
                    ? 'Clique em cada opção para expandir os horários, itinerários e botão de confirmação:'
                    : 'Confira os detalhes e horários do voo selecionado para sua viagem:'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {opcoesVoo.map((opcao, idx) => {
                  const calc = calcularOpcaoVoo({
                    custo: opcao.custo,
                    margem_desejada: opcao.margem_desejada,
                    imposto_percentual: opcao.imposto_percentual,
                    preco_mercado: opcao.preco_mercado,
                    modo_precificacao: opcao.modo_precificacao,
                    desconto_mercado_percentual: opcao.desconto_mercado_percentual,
                  })

                  const valorPorPessoa = calc.precoFinal / numPassageiros
                  const isMaisBarata = indiceMaisBarata === idx
                  const estaAberto = Boolean(cardsAbertos[idx])

                  const tituloOpcao =
                    opcao.descricao ||
                    `${opcao.companhia || 'Voo'} ${opcao.origem ? `(${opcao.origem})` : ''} → ${opcao.destino ? `(${opcao.destino})` : ''}`

                  // Link WhatsApp direto desta opção
                  const msgTexto = `Olá! Recebi a proposta #${cotacao.codigo} para ${cotacao.destino} e tenho interesse na *Opção ${idx + 1}* (${tituloOpcao}) por *${formatarMoeda(calc.precoFinal, cotacao.moeda)}*. Como podemos prosseguir com a emissão?`
                  const linkWhatsAppOpcao = whatsappAgencia
                    ? `https://wa.me/${whatsappAgencia}?text=${encodeURIComponent(msgTexto)}`
                    : `https://api.whatsapp.com/send?text=${encodeURIComponent(msgTexto)}`

                  return (
                    <div
                      key={opcao.id || idx}
                      className={`border-2 rounded-2xl shadow-sm transition overflow-hidden ${
                        isMaisBarata
                          ? 'border-emerald-500 bg-gradient-to-b from-emerald-50/30 to-white shadow-emerald-500/5'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      {/* Cabeçalho do Card (Clicável) */}
                      <div
                        onClick={() => toggleCard(idx)}
                        className={`p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer transition select-none ${
                          isMaisBarata ? 'hover:bg-emerald-50/50' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded">
                              Opção #{idx + 1}
                            </span>

                            {isMaisBarata && (
                              <span className="text-xs font-black px-2.5 py-0.5 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-300 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                Mais barata
                              </span>
                            )}

                            {opcao.observacao && opcao.observacao.trim() && (
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                                {opcao.observacao.trim()}
                              </span>
                            )}
                          </div>

                          <h3 className="text-base font-bold text-slate-900">{tituloOpcao}</h3>

                          <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                            <span className="flex items-center gap-1 font-medium">
                              <Plane className="w-3.5 h-3.5 text-sky-700" />
                              {opcao.companhia || 'Companhia Aérea'}{' '}
                              {opcao.numero_voo ? `(${opcao.numero_voo})` : ''}
                            </span>
                            {opcao.data_voo && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {formatarData(opcao.data_voo)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Preço e Botão de Expandir */}
                        <div className="sm:text-right w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex sm:flex-col justify-between items-end">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Preço Final da Opção
                            </span>
                            <span className="text-2xl font-black text-slate-900 block leading-tight">
                              {formatarMoeda(calc.precoFinal, cotacao.moeda)}
                            </span>
                            <span className="text-xs font-semibold text-sky-700 block mt-0.5">
                              {formatarMoeda(valorPorPessoa, cotacao.moeda)} / adulto (
                              {numPassageiros}x)
                            </span>
                          </div>

                          <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg mt-2 sm:self-end">
                            <span>{estaAberto ? 'Ocultar detalhes' : 'Ver detalhes'}</span>
                            <ChevronDown
                              className={`w-4 h-4 text-slate-500 transition-transform ${
                                estaAberto ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Corpo Expansível */}
                      {estaAberto && (
                        <div className="px-5 pb-5 pt-0 border-t border-slate-100 space-y-4 animate-fadeIn">
                          {/* Box de Rota */}
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-3 space-y-3">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              {/* Origem */}
                              <div className="space-y-0.5">
                                <span className="text-[10px] uppercase font-bold text-slate-500">
                                  Origem
                                </span>
                                <div className="text-sm font-bold text-slate-900">
                                  {opcao.origem || 'Origem'}
                                </div>
                                {opcao.horario_partida && (
                                  <div className="text-xs font-bold text-sky-700 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> {opcao.horario_partida}
                                  </div>
                                )}
                              </div>

                              {/* Linha Divisória */}
                              <div className="flex items-center gap-2 flex-1 justify-center w-full sm:w-auto">
                                <div className="h-px bg-slate-300 flex-1" />
                                <span className="text-sky-700 text-sm font-bold">➔</span>
                                <div className="h-px bg-slate-300 flex-1" />
                              </div>

                              {/* Destino */}
                              <div className="space-y-0.5 sm:text-right">
                                <span className="text-[10px] uppercase font-bold text-slate-500">
                                  Destino
                                </span>
                                <div className="text-sm font-bold text-slate-900">
                                  {opcao.destino || 'Destino'}
                                </div>
                                {opcao.horario_chegada && (
                                  <div className="text-xs font-bold text-sky-700 flex items-center sm:justify-end gap-1">
                                    <Clock className="w-3.5 h-3.5" /> {opcao.horario_chegada}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Vantagem Comercial / Economia vs Balcão */}
                            {calc.temVantagemComercial && opcao.preco_mercado && (
                              <div className="flex items-center gap-2 text-emerald-900 bg-emerald-100/80 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold">
                                <Sparkles className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                                <span>
                                  <strong>
                                    Economia de{' '}
                                    {formatarMoeda(calc.economiaClienteReais, cotacao.moeda)}
                                  </strong>{' '}
                                  ({calc.economiaClientePercent.toFixed(0)}% OFF em relação ao preço
                                  de balcão)
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Botão WhatsApp Direto Desta Opção */}
                          <div className="pt-2 border-t border-dashed border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <span className="text-xs text-slate-600 text-center sm:text-left">
                              Gostou da <strong>Opção #{idx + 1}</strong>? Garanta agora falando
                              direto com o consultor:
                            </span>

                            <a
                              href={linkWhatsAppOpcao}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-md transition"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Confirmar Opção #{idx + 1} no WhatsApp
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            {/* SERVIÇOS TERRESTRES INCLUSOS */}
            {(cotacao.servicos || []).length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-700" />
                    <span>Serviços Terrestres & Inclusões no Pacote</span>
                  </h2>
                  <span className="text-xs font-semibold text-slate-500">
                    {cotacao.servicos.length} {cotacao.servicos.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider">
                        <th className="py-3 px-4 font-bold">Serviço / Detalhes</th>
                        <th className="py-3 px-4 text-center font-bold w-20">Qtd</th>
                        <th className="py-3 px-4 text-right font-bold w-28">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {cotacao.servicos.map((servico, index) => {
                        const catObj = CATEGORIAS_SERVICO.find((c) => c.value === servico.categoria)
                        return (
                          <tr
                            key={servico.id || index}
                            className={index % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}
                          >
                            <td className="py-3.5 px-4 space-y-1">
                              <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                                {catObj?.label || servico.categoria}
                              </span>
                              <div className="font-bold text-slate-900 text-sm">{servico.nome}</div>
                              {servico.descricao && (
                                <div className="text-xs text-slate-600 leading-relaxed">
                                  {servico.descricao}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                              {servico.quantidade || 1}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                                Incluso
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* FORMAS DE PAGAMENTO & CONDIÇÕES */}
            <section className="space-y-4">
              {(cotacao.formas_pagamento || agencia.formas_pagamento_padrao) && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-1.5">
                  <div className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-sky-700" />
                    <span>Formas de Pagamento & Condições Comerciais</span>
                  </div>
                  <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                    {cotacao.formas_pagamento || agencia.formas_pagamento_padrao}
                  </p>
                </div>
              )}

              {cotacao.observacoes && (
                <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-5 space-y-1.5">
                  <div className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-sky-700" />
                    <span>Observações Importantes do Consultor</span>
                  </div>
                  <p className="text-xs text-sky-950 whitespace-pre-line leading-relaxed">
                    {cotacao.observacoes}
                  </p>
                </div>
              )}

              {(cotacao.condicoes_gerais || agencia.condicoes_padrao) && (
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-5 space-y-1.5">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Condições Gerais & Cancelamento
                  </div>
                  <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                    {cotacao.condicoes_gerais || agencia.condicoes_padrao}
                  </p>
                </div>
              )}
            </section>

            {/* CTA GERAL / CONTATO RÁPIDO */}
            <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-6 sm:p-7 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-5">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-base font-extrabold text-white">
                  Dúvidas ou deseja personalizar este roteiro?
                </h3>
                <p className="text-xs text-sky-200">
                  Estamos à disposição para ajustar datas, opções de voo e adicionar novos passeios.
                </p>
              </div>

              <a
                href={linkWhatsAppGeral}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm py-3 px-6 rounded-xl shadow-lg transition flex-shrink-0"
              >
                <MessageCircle className="w-5 h-5" />
                Falar com o Consultor no WhatsApp
              </a>
            </section>
          </main>

          {/* Footer */}
          <footer className="p-6 border-t border-slate-200 text-center space-y-1 bg-slate-50/50 text-xs text-slate-500">
            <p className="font-bold text-slate-800">
              {agencia.mensagem_agradecimento ||
                'Agradecemos a oportunidade de planejar sua viagem! Estamos à sua disposição.'}
            </p>
            <p className="text-[11px] text-slate-400">
              {agencia.nome_agencia} {agencia.endereco ? `• ${agencia.endereco}` : ''}
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}
