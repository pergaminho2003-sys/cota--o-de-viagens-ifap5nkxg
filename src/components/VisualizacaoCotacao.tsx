import React, { useRef } from 'react'
import {
  Cotacao,
  ConfiguracoesAgencia,
  CATEGORIAS_SERVICO,
  STATUS_COTACAO_CONFIG,
} from '@/types/cotacao'
import {
  formatarMoeda,
  formatarData,
  calcularDuracaoDias,
  calcularTotaisCotacao,
} from '@/lib/calculos'
import { imprimirOuSalvarPDF } from '@/lib/geradorDocumento'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Printer,
  Download,
  Share2,
  ArrowLeft,
  Edit,
  Building2,
  Calendar,
  Users,
  MapPin,
  CheckCircle2,
  Sparkles,
  DollarSign,
  Send,
  MessageCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface VisualizacaoCotacaoProps {
  cotacao: Cotacao
  configAgencia: ConfiguracoesAgencia
  onVoltar: () => void
  onEditar?: (cotacao: Cotacao) => void
}

export function VisualizacaoCotacao({
  cotacao,
  configAgencia,
  onVoltar,
  onEditar,
}: VisualizacaoCotacaoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const duracao = calcularDuracaoDias(cotacao.data_ida, cotacao.data_volta)
  const totalPassageiros = (cotacao.num_passageiros || 1) + (cotacao.num_criancas || 0)
  const valorPorPessoa = (cotacao.valor_venda_total || 0) / (cotacao.num_passageiros || 1)

  const impostoAliquota =
    configAgencia.imposto_lucro_padrao !== undefined ? configAgencia.imposto_lucro_padrao : 6

  const totais = calcularTotaisCotacao({
    servicos: cotacao.servicos || [],
    modoPrecificacao: cotacao.modo_precificacao || 'margem',
    margemLucroPercent: cotacao.margem_lucro,
    descontoMercadoPercent: cotacao.desconto_mercado_percentual,
    precoMercado: cotacao.preco_mercado,
    desconto: cotacao.desconto || 0,
    taxasAdicionais: cotacao.taxas_adicionais || 0,
    numPassageiros: cotacao.num_passageiros || 1,
    impostoLucroPercent: impostoAliquota,
  })

  const temComparativoMercado =
    cotacao.preco_mercado !== undefined &&
    cotacao.preco_mercado !== null &&
    cotacao.preco_mercado > 0 &&
    totais.economiaClienteReais > 0

  const statusConfig = STATUS_COTACAO_CONFIG[cotacao.status] || STATUS_COTACAO_CONFIG.rascunho

  const handleGerarPDF = () => {
    imprimirOuSalvarPDF(cotacao, configAgencia)
  }

  const handleCopiarResumoWhatsApp = () => {
    const texto = `*PROPOSTA DE VIAGEM - ${configAgencia.nome_agencia || 'Agência'}*
✈️ *Destino:* ${cotacao.destino}
📅 *Período:* ${formatarData(cotacao.data_ida)} a ${formatarData(cotacao.data_volta)} (${duracao ? `${duracao} dias` : ''})
👥 *Passageiros:* ${cotacao.num_passageiros} adulto(s)${cotacao.num_criancas > 0 ? ` + ${cotacao.num_criancas} criança(s)` : ''}

*Serviços Inclusos:*
${cotacao.servicos.map((s) => `• ${s.nome}${s.descricao ? ` (${s.descricao})` : ''}`).join('\n')}

💰 *Valor Total da Proposta:* ${formatarMoeda(cotacao.valor_venda_total, cotacao.moeda)}
👤 *Por adulto:* ${formatarMoeda(valorPorPessoa, cotacao.moeda)}

${cotacao.formas_pagamento ? `💳 *Condições de Pagamento:*\n${cotacao.formas_pagamento}\n` : ''}
Qualquer dúvida estamos à disposição!`

    navigator.clipboard.writeText(texto)
    toast.success('Resumo formatado copiado! Cole no WhatsApp ou e-mail.')
  }

  const handleEnviarWhatsApp = () => {
    const telefoneLimpo = (cotacao.cliente_telefone || '').replace(/\D/g, '')
    const texto = `Olá ${cotacao.cliente_nome}! Segue a proposta da sua viagem para *${cotacao.destino}* no valor total de *${formatarMoeda(cotacao.valor_venda_total, cotacao.moeda)}*.\n\nFicamos à disposição para qualquer ajuste!`
    const url = telefoneLimpo
      ? `https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(url, '_blank')
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
              className="text-slate-700 border-slate-300 hover:bg-slate-50"
            >
              <Edit className="w-4 h-4 mr-1.5 text-slate-500" />
              Editar Cotação
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopiarResumoWhatsApp}
            className="border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-semibold"
          >
            <MessageCircle className="w-4 h-4 mr-1.5 text-emerald-600" />
            Copiar p/ WhatsApp
          </Button>

          <Button
            size="sm"
            onClick={handleGerarPDF}
            className="bg-navy-900 bg-sky-900 hover:bg-sky-950 text-white font-bold shadow-sm"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </div>

      {/* DOCUMENT PREVIEW CARD (Design de Proposta Comercial Azul Marinho e Branco) */}
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
            <div className="text-lg font-black text-slate-900">{cotacao.codigo}</div>
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
                {configAgencia.whatsapp || configAgencia.telefone_contato}
              </div>
            )}
            {configAgencia.site_instagram && (
              <div className="text-xs text-slate-600">
                <strong className="text-slate-700">Canais:</strong> {configAgencia.site_instagram}
              </div>
            )}
          </div>
        </div>

        {/* Tabela de Serviços Inclusos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-700" />
              <span>Serviços e Itens Inclusos na Proposta</span>
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
                        {servico.observacoes && (
                          <div className="text-[11px] text-slate-400 italic">
                            Obs: {servico.observacoes}
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

        {/* Resumo do Investimento da Proposta & Comparativo de Economia */}
        <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-end gap-4 pt-2">
          {temComparativoMercado && (
            <div className="flex-1 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl p-5 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Vantagem Comercial / Economia Garantida</span>
                </div>
                <span className="bg-emerald-600 text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded-full shadow-sm">
                  {totais.economiaClientePercent.toFixed(0)}% OFF
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Preço de Mercado de Referência:
                  </span>
                  <span className="text-sm font-bold text-slate-500 line-through">
                    {formatarMoeda(cotacao.preco_mercado, cotacao.moeda)}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[11px] font-extrabold text-emerald-800 block">
                    Sua Economia Garantida:
                  </span>
                  <span className="text-lg font-black text-emerald-700">
                    {formatarMoeda(totais.economiaClienteReais, cotacao.moeda)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-xs font-semibold text-emerald-900">
                <span>Investimento Especial da Proposta:</span>
                <span className="font-extrabold text-emerald-800">
                  {formatarMoeda(cotacao.valor_venda_total, cotacao.moeda)}
                </span>
              </div>
            </div>
          )}

          <div className="w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wider font-extrabold text-slate-500">
                Valor Total da Viagem
              </div>
              <div className="text-2xl font-black text-slate-950">
                {formatarMoeda(cotacao.valor_venda_total, cotacao.moeda)}
              </div>
              <div className="text-xs font-semibold text-sky-700 pt-0.5">
                {formatarMoeda(valorPorPessoa, cotacao.moeda)} / adulto ({cotacao.num_passageiros}x)
              </div>
            </div>

            {totalPassageiros > 1 && (
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
                <span>Total de Passageiros:</span>
                <span className="font-bold text-slate-700">
                  {cotacao.num_passageiros} adulto(s)
                  {cotacao.num_criancas > 0 ? ` + ${cotacao.num_criancas} criança(s)` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

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
