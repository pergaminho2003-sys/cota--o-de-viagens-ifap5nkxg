import React, { useRef } from 'react'
import {
  Cotacao,
  ConfiguracoesAgencia,
  CATEGORIAS_SERVICO,
  STATUS_COTACAO_CONFIG,
  OpcaoVoo,
} from '@/types/cotacao'
import {
  formatarMoeda,
  formatarData,
  calcularDuracaoDias,
  calcularOpcaoVoo,
  encontrarIndiceOpcaoMaisBarata,
} from '@/lib/calculos'
import {
  imprimirOuSalvarPDF,
  baixarArquivoHTMLProposta,
  abrirPreviaHTMLProposta,
} from '@/lib/geradorDocumento'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Printer,
  ArrowLeft,
  Edit,
  Building2,
  Calendar,
  Users,
  MapPin,
  CheckCircle2,
  Sparkles,
  DollarSign,
  MessageCircle,
  Plane,
  Layers,
  ArrowRight,
  FileCode,
  Download,
  Share2,
  ChevronDown,
  ExternalLink,
  Globe,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'

interface VisualizacaoCotacaoProps {
  cotacao: Cotacao
  configAgencia: ConfiguracoesAgencia
  onVoltar: () => void
  onEditar?: (cotacao: Cotacao) => void
  onAtualizarPublica?: (novaCotacao: Cotacao) => void
}

export function VisualizacaoCotacao({
  cotacao,
  configAgencia,
  onVoltar,
  onEditar,
  onAtualizarPublica,
}: VisualizacaoCotacaoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const duracao = calcularDuracaoDias(cotacao.data_ida, cotacao.data_volta)
  const totalPassageiros = (cotacao.num_passageiros || 1) + (cotacao.num_criancas || 0)
  const numPassageiros = cotacao.num_passageiros || 1

  const margemFallback =
    cotacao.margem_lucro !== undefined && cotacao.margem_lucro !== null
      ? Number(cotacao.margem_lucro)
      : (configAgencia.margem_padrao ?? 15)

  const opcoesVoo: OpcaoVoo[] =
    cotacao.opcoes_voo && cotacao.opcoes_voo.length > 0
      ? cotacao.opcoes_voo
      : [
          {
            companhia: 'Companhia Aérea',
            descricao: 'Opção Principal de Voo',
            origem: 'São Paulo',
            destino: cotacao.destino || '',
            observacao: '',
            custo: cotacao.valor_custo_total || 0,
            margem_desejada: isNaN(margemFallback) ? 15 : margemFallback,
            imposto_percentual: configAgencia.imposto_lucro_padrao ?? 6,
            preco_mercado: cotacao.preco_mercado,
            modo_precificacao: cotacao.modo_precificacao || 'margem',
            desconto_mercado_percentual:
              cotacao.desconto_mercado_percentual !== undefined &&
              cotacao.desconto_mercado_percentual !== null
                ? Number(cotacao.desconto_mercado_percentual)
                : 10,
            ordem: 0,
          },
        ]

  const statusConfig = STATUS_COTACAO_CONFIG[cotacao.status] || STATUS_COTACAO_CONFIG.rascunho

  const handleGerarPDF = () => {
    imprimirOuSalvarPDF(cotacao, configAgencia)
  }

  const handleCopiarLinkPublico = () => {
    const baseUrl = window.location.origin
    const url = `${baseUrl}/c/${cotacao.codigo}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado!')
  }

  const handleBaixarHTML = () => {
    try {
      baixarArquivoHTMLProposta(cotacao, configAgencia)
      toast.success('Arquivo HTML gerado com sucesso! Pronto para envio no WhatsApp.')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao gerar arquivo HTML.')
    }
  }

  const handleAbrirPreviaHTML = () => {
    try {
      abrirPreviaHTMLProposta(cotacao, configAgencia)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao abrir prévia da versão HTML.')
    }
  }

  const indiceMaisBarata = encontrarIndiceOpcaoMaisBarata(opcoesVoo)

  const handleCopiarResumoWhatsApp = () => {
    const textoOpcoes = opcoesVoo
      .map((op, i) => {
        const c = calcularOpcaoVoo({
          custo: op.custo,
          margem_desejada: op.margem_desejada,
          imposto_percentual: op.imposto_percentual,
          preco_mercado: op.preco_mercado,
          modo_precificacao: op.modo_precificacao,
          desconto_mercado_percentual: op.desconto_mercado_percentual,
        })
        const porAdulto = c.precoFinal / numPassageiros
        const tagMaisBarata = indiceMaisBarata === i ? ' [MAIS BARATA]' : ''
        const obs = op.observacao ? ` - _${op.observacao.trim()}_` : ''
        return `*Opção ${i + 1}${tagMaisBarata}:* ${op.descricao || `${op.companhia} ${op.origem} → ${op.destino}`}${obs}
💰 Valor: ${formatarMoeda(c.precoFinal, cotacao.moeda)} (${formatarMoeda(porAdulto, cotacao.moeda)}/adulto)`
      })
      .join('\n\n')

    const texto = `*PROPOSTA DE VIAGEM - ${configAgencia.nome_agencia || 'Agência'}*
✈️ *Destino:* ${cotacao.destino}
📅 *Período:* ${formatarData(cotacao.data_ida)} a ${formatarData(cotacao.data_volta)} (${duracao ? `${duracao} dias` : ''})
👥 *Passageiros:* ${cotacao.num_passageiros} adulto(s)${cotacao.num_criancas > 0 ? ` + ${cotacao.num_criancas} criança(s)` : ''}

*OPÇÕES DE VOO DISPONÍVEIS:*
${textoOpcoes}

${(cotacao.servicos || []).length > 0 ? `*Serviços Terrestres Inclusos:*\n${cotacao.servicos.map((s) => `• ${s.nome}${s.descricao ? ` (${s.descricao})` : ''}`).join('\n')}\n` : ''}
${cotacao.formas_pagamento ? `💳 *Condições de Pagamento:*\n${cotacao.formas_pagamento}\n` : ''}
Qualquer dúvida estamos à disposição!`

    navigator.clipboard.writeText(texto)
    toast.success('Resumo com opções de voo copiado! Cole no WhatsApp ou e-mail.')
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onVoltar} className="text-slate-700">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Voltar
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500">{cotacao.codigo}</span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusConfig.badgeClass}`}
              >
                {statusConfig.label}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{cotacao.destino}</h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {onEditar && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditar(cotacao)}
              className="text-slate-700 border-slate-300 hover:bg-slate-50 text-xs"
            >
              <Edit className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Editar Cotação
            </Button>
          )}

          {/* Botão Principal: Compartilhar Link Público */}
          <Button
            size="sm"
            onClick={handleCopiarLinkPublico}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm border border-emerald-500 text-xs flex items-center gap-1.5"
            title="Copia o link permanente da cotação para enviar ao cliente"
          >
            <Share2 className="w-3.5 h-3.5" />
            Compartilhar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopiarResumoWhatsApp}
            className="border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-semibold text-xs"
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Copiar Texto WhatsApp
          </Button>

          {/* Botão Gerar Versão HTML estática mantida */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleBaixarHTML}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs"
            title="Gera um arquivo HTML autocontido com botões interativos para enviar via WhatsApp"
          >
            <FileCode className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Gerar versão HTML
          </Button>

          {/* Menu de Exportação Adicional com PDF e Opções */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="bg-sky-900 hover:bg-sky-950 text-white font-bold shadow-sm"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Exportar / PDF
                <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs">Opções de Exportação</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={handleCopiarLinkPublico}
                className="cursor-pointer text-emerald-800 font-semibold"
              >
                <Share2 className="w-4 h-4 mr-2 text-emerald-600" />
                <span>Copiar Link Público</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleGerarPDF} className="cursor-pointer">
                <Printer className="w-4 h-4 mr-2 text-sky-700" />
                <span>Imprimir / Salvar PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBaixarHTML} className="cursor-pointer">
                <Download className="w-4 h-4 mr-2 text-emerald-600" />
                <div>
                  <div className="font-semibold text-xs">Baixar Arquivo HTML</div>
                  <div className="text-[10px] text-slate-500">Arquivo estático autocontido</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAbrirPreviaHTML} className="cursor-pointer">
                <ExternalLink className="w-4 h-4 mr-2 text-slate-500" />
                <span className="text-xs">Testar versão HTML no navegador</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* DOCUMENT PREVIEW CARD */}
      <div
        ref={containerRef}
        className="bg-white border border-slate-300 rounded-2xl shadow-xl overflow-hidden print:shadow-none print:border-none p-6 sm:p-12 text-slate-800 space-y-8"
      >
        {/* Header da Proposta */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b-2 border-slate-900 pb-6">
          <div className="space-y-1">
            {configAgencia.logo_url ? (
              <img
                src={configAgencia.logo_url}
                alt={configAgencia.nome_agencia}
                className="max-h-16 max-w-[220px] object-contain mb-2"
              />
            ) : (
              <div className="flex items-center gap-2 text-slate-900 font-black text-2xl tracking-tight">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-900 to-slate-900 flex items-center justify-center text-white shadow-md">
                  ✈
                </div>
                <span>{configAgencia.nome_agencia || 'Aura Viagens'}</span>
              </div>
            )}
            <p className="text-xs text-slate-500">
              {configAgencia.cnpj_cadastur && `${configAgencia.cnpj_cadastur} • `}
              {configAgencia.email_contato || ''}
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div className="inline-block bg-sky-900 text-white px-3.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
              Proposta Comercial de Viagem
            </div>
            <div className="text-lg font-black text-slate-900 flex items-center justify-start sm:justify-end gap-2">
              <span>{cotacao.codigo}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cotacao.publica !== false ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-200'}`}
              >
                {cotacao.publica !== false ? 'Link Ativo' : 'Link Inativo'}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Emitida em: {formatarData(cotacao.created || new Date().toISOString())}
            </div>
          </div>
        </div>

        {/* Hero Banner do Destino */}
        <div className="rounded-xl bg-gradient-to-r from-slate-900 via-sky-950 to-sky-900 text-white p-6 sm:p-8 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-widest text-sky-300 font-bold flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> Destino da Viagem
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {cotacao.destino}
            </h1>
            <div className="text-sm text-sky-100 flex items-center gap-2 pt-1 font-medium">
              <Calendar className="w-4 h-4 text-sky-300" />
              <span>
                {formatarData(cotacao.data_ida)} até {formatarData(cotacao.data_volta)}
                {duracao ? ` • (${duracao} dias / ${duracao > 1 ? duracao - 1 : 1} noites)` : ''}
              </span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 sm:text-right min-w-[200px]">
            <div className="text-xs uppercase tracking-wider text-sky-200 font-bold">
              Passageiros
            </div>
            <div className="text-xl font-black text-white mt-1">
              {cotacao.num_passageiros} {cotacao.num_passageiros > 1 ? 'Adultos' : 'Adulto'}
              {cotacao.num_criancas > 0 ? ` + ${cotacao.num_criancas} Criança(s)` : ''}
            </div>
            <div className="text-xs text-sky-200 mt-0.5">
              Total de {totalPassageiros} viajante(s)
            </div>
          </div>
        </div>

        {/* Informações em Cards: Cliente & Agência */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2">
            <div className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
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
            <div className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
              <Building2 className="w-4 h-4 text-sky-700" />
              <span>Consultoria de Viagem</span>
            </div>
            <div className="text-sm font-bold text-slate-900">{configAgencia.nome_agencia}</div>
            {(configAgencia.telefone_contato || configAgencia.whatsapp) && (
              <div className="text-xs text-slate-600">
                <strong className="text-slate-700">Contato:</strong>{' '}
                {configAgencia.telefone_contato || configAgencia.whatsapp}
              </div>
            )}
            {configAgencia.site_instagram && (
              <div className="text-xs text-slate-600">
                <strong className="text-slate-700">Canais:</strong> {configAgencia.site_instagram}
              </div>
            )}
          </div>
        </div>

        {/* SEÇÃO: OPÇÕES DE VOO INDEPENDENTES (AJUSTE 1) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Plane className="w-4 h-4 text-sky-700" />
                <span>Opções de Voo Disponíveis ({opcoesVoo.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Valores calculados de forma independente por opção — selecione a melhor alternativa
                para sua viagem.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {opcoesVoo.map((opcao, index) => {
              const calc = calcularOpcaoVoo({
                custo: opcao.custo,
                margem_desejada: opcao.margem_desejada,
                imposto_percentual: opcao.imposto_percentual,
                preco_mercado: opcao.preco_mercado,
                modo_precificacao: opcao.modo_precificacao,
                desconto_mercado_percentual: opcao.desconto_mercado_percentual,
              })

              const valorPorPessoa = calc.precoFinal / numPassageiros
              const isMaisBarata = indiceMaisBarata === index

              return (
                <div
                  key={opcao.id || index}
                  className={`border-2 rounded-xl p-5 shadow-sm space-y-4 transition ${
                    isMaisBarata
                      ? 'border-emerald-500 bg-emerald-50/20'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                          Opção #{index + 1}
                        </span>

                        {isMaisBarata && (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-300">
                            Mais barata
                          </span>
                        )}

                        {opcao.observacao && opcao.observacao.trim() && (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                            {opcao.observacao.trim()}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-slate-900">
                        {opcao.descricao ||
                          `${opcao.companhia || 'Companhia'} • ${opcao.origem} → ${opcao.destino}`}
                      </h4>
                      <p className="text-xs text-slate-600">
                        <strong>Companhia:</strong> {opcao.companhia || 'Aérea'}{' '}
                        {opcao.numero_voo ? `(${opcao.numero_voo})` : ''}
                        {opcao.data_voo ? ` • Data: ${formatarData(opcao.data_voo)}` : ''}
                      </p>
                    </div>

                    <div className="sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-lg border sm:border-0 border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Preço Final da Opção
                      </span>
                      <span className="text-2xl font-black text-slate-900 block">
                        {formatarMoeda(calc.precoFinal, cotacao.moeda)}
                      </span>
                      <span className="text-xs font-semibold text-sky-700 block">
                        {formatarMoeda(valorPorPessoa, cotacao.moeda)} / adulto ({numPassageiros}x)
                      </span>
                    </div>
                  </div>

                  {/* Detalhes de Rota e Horários */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                    <div className="flex items-center gap-2 font-medium text-slate-700 flex-wrap">
                      <span>{opcao.origem || 'Origem'}</span>
                      {opcao.horario_partida && (
                        <span className="text-sky-700 font-bold">({opcao.horario_partida})</span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span>{opcao.destino || 'Destino'}</span>
                      {opcao.horario_chegada && (
                        <span className="text-sky-700 font-bold">({opcao.horario_chegada})</span>
                      )}
                    </div>

                    {calc.temVantagemComercial && opcao.preco_mercado && (
                      <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded text-xs font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          Economia de {formatarMoeda(calc.economiaClienteReais, cotacao.moeda)} (
                          {calc.economiaClientePercent.toFixed(0)}% OFF vs balcão)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tabela de Serviços Terrestres Adicionais (se houver) */}
        {(cotacao.servicos || []).length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-700" />
                <span>Serviços Terrestres Inclusos no Pacote</span>
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {cotacao.servicos.length} {cotacao.servicos.length === 1 ? 'item' : 'itens'}
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Serviço / Detalhes</th>
                    <th className="py-3 px-4 text-center font-bold w-24">Qtd</th>
                    <th className="py-3 px-4 text-right font-bold w-32">Status</th>
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
          </div>
        )}

        {/* Formas de Pagamento & Condições */}
        <div className="space-y-4 pt-2">
          {(cotacao.formas_pagamento || configAgencia.formas_pagamento_padrao) && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-1.5">
              <div className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-sky-700" />
                <span>Formas de Pagamento & Condições Comerciais</span>
              </div>
              <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {cotacao.formas_pagamento || configAgencia.formas_pagamento_padrao}
              </p>
            </div>
          )}

          {cotacao.observacoes && (
            <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-5 space-y-1.5">
              <div className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-700" />
                <span>Observações Importantes do Consultor</span>
              </div>
              <p className="text-xs text-sky-950 whitespace-pre-line leading-relaxed">
                {cotacao.observacoes}
              </p>
            </div>
          )}

          {(cotacao.condicoes_gerais || configAgencia.condicoes_padrao) && (
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-5 space-y-1.5">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Condições Gerais & Cancelamento
              </div>
              <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                {cotacao.condicoes_gerais || configAgencia.condicoes_padrao}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-200 text-center space-y-1.5">
          <p className="text-xs font-bold text-slate-800">
            {configAgencia.mensagem_agradecimento ||
              'Agradecemos a oportunidade de planejar sua viagem! Estamos à disposição para qualquer ajuste.'}
          </p>
          <p className="text-[11px] text-slate-400">
            {configAgencia.nome_agencia} • {configAgencia.endereco || ''}
          </p>
        </div>
      </div>
    </div>
  )
}
