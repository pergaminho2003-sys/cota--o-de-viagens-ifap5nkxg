import { Moeda } from '@/types/cotacao'

export function formatarMoeda(valor: number | undefined | null, moeda: Moeda = 'BRL'): string {
  const num = Number(valor) || 0
  switch (moeda) {
    case 'USD':
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num)
    case 'EUR':
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(num)
    case 'BRL':
    default:
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
  }
}

export function formatarData(dataStr?: string): string {
  if (!dataStr) return '-'
  try {
    // Handling YYYY-MM-DD to avoid timezone shifting
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
      const [ano, mes, dia] = dataStr.split('-')
      return `${dia}/${mes}/${ano}`
    }
    const d = new Date(dataStr)
    if (isNaN(d.getTime())) return dataStr
    return d.toLocaleDateString('pt-BR')
  } catch {
    return dataStr
  }
}

export function calcularDuracaoDias(dataIda?: string, dataVolta?: string): number | null {
  if (!dataIda || !dataVolta) return null
  try {
    const d1 = new Date(dataIda)
    const d2 = new Date(dataVolta)
    const diffTime = d2.getTime() - d1.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  } catch {
    return null
  }
}

export interface TotaisCalculados {
  valorCustoTotal: number
  valorMargemLucro: number
  valorSubtotalComMargem: number
  aliquotaImpostoLucro: number
  valorImpostoLucro: number
  valorLucroLiquido: number
  margemLiquidaCheiaPercent: number
  valorTaxas: number
  valorDesconto: number
  valorFinalVenda: number
  valorPorPessoa: number
}

export interface SimulacaoDescontoResultado {
  precoVendaCheio: number
  lucroBrutoCheio: number
  impostoCheio: number
  lucroLiquidoCheio: number
  margemLiquidaCheiaPercent: number
  precoFinalMinimo: number
  descontoMaximoReais: number
  descontoMaximoPercent: number
  impostoPagoCenarioMinimo: number
  lucroLiquidoMinimo: number
  margemLiquidaFinalPercent: number
  economiaClienteReais: number
  percentualEconomiaMercado: number
  precoMercado?: number
  margemMinimaAceitavelPercent?: number
  possuiSimulacaoValida: boolean
}

export function calcularSimulacaoDesconto(params: {
  custoTotal: number
  markupPercent: number
  impostoPercent: number
  precoMercado?: number
  margemMinimaAceitavelPercent?: number
}): SimulacaoDescontoResultado {
  const custo = Math.max(0, Number(params.custoTotal) || 0)
  const markup = Number(params.markupPercent) || 0
  const impostoAliquota = (Number(params.impostoPercent) || 0) / 100 // imposto % em decimal, ex: 0.06
  const margemMinima =
    params.margemMinimaAceitavelPercent !== undefined &&
    params.margemMinimaAceitavelPercent !== null &&
    !isNaN(Number(params.margemMinimaAceitavelPercent))
      ? Number(params.margemMinimaAceitavelPercent)
      : 10
  const margemMinimaDecimal = margemMinima / 100
  const precoMercado =
    params.precoMercado !== undefined &&
    params.precoMercado !== null &&
    !isNaN(Number(params.precoMercado)) &&
    Number(params.precoMercado) > 0
      ? Number(params.precoMercado)
      : undefined

  // Cenário Cheio
  const precoVendaCheio = custo * (1 + markup / 100)
  const lucroBrutoCheio = precoVendaCheio - custo
  const impostoCheio = lucroBrutoCheio * impostoAliquota
  const lucroLiquidoCheio = lucroBrutoCheio - impostoCheio
  const margemLiquidaCheiaPercent =
    precoVendaCheio > 0 ? (lucroLiquidoCheio / precoVendaCheio) * 100 : 0

  // Preço final mínimo
  // Fórmula: Preço final mínimo = [Custo × (1 − imposto %)] ÷ [1 − imposto % − margem mínima aceitável %]
  const denominador = 1 - impostoAliquota - margemMinimaDecimal
  let precoFinalMinimo = 0
  if (denominador > 0 && custo > 0) {
    precoFinalMinimo = (custo * (1 - impostoAliquota)) / denominador
  } else if (custo === 0) {
    precoFinalMinimo = 0
  } else {
    // Se denominador <= 0 (margem + imposto >= 100%), fallback seguro para não dividir por zero
    precoFinalMinimo = precoVendaCheio
  }

  // Lucro bruto e imposto no cenário com desconto máximo
  const lucroBrutoCenarioMinimo = Math.max(0, precoFinalMinimo - custo)
  const impostoPagoCenarioMinimo = lucroBrutoCenarioMinimo * impostoAliquota
  const lucroLiquidoMinimo = lucroBrutoCenarioMinimo - impostoPagoCenarioMinimo
  const margemLiquidaFinalPercent =
    precoFinalMinimo > 0 ? (lucroLiquidoMinimo / precoFinalMinimo) * 100 : margemMinima

  // Desconto máximo
  const descontoMaximoReais = Math.max(0, precoVendaCheio - precoFinalMinimo)
  const descontoMaximoPercent =
    precoVendaCheio > 0 ? (descontoMaximoReais / precoVendaCheio) * 100 : 0

  // Economia do cliente frente ao mercado
  let economiaClienteReais = 0
  let percentualEconomiaMercado = 0
  if (precoMercado !== undefined && precoMercado > 0) {
    economiaClienteReais = Math.max(0, precoMercado - precoFinalMinimo)
    percentualEconomiaMercado = (economiaClienteReais / precoMercado) * 100
  }

  const possuiSimulacaoValida =
    custo > 0 && precoVendaCheio > 0 && precoMercado !== undefined && precoMercado > 0

  return {
    precoVendaCheio,
    lucroBrutoCheio,
    impostoCheio,
    lucroLiquidoCheio,
    margemLiquidaCheiaPercent,
    precoFinalMinimo,
    descontoMaximoReais,
    descontoMaximoPercent,
    impostoPagoCenarioMinimo,
    lucroLiquidoMinimo,
    margemLiquidaFinalPercent,
    economiaClienteReais,
    percentualEconomiaMercado,
    precoMercado,
    margemMinimaAceitavelPercent: margemMinima,
    possuiSimulacaoValida,
  }
}

export function calcularTotaisCotacao(params: {
  servicos: Array<{ valor_custo_total?: number; valor_unitario?: number; quantidade?: number }>
  margemLucroPercent: number
  desconto: number
  taxasAdicionais: number
  numPassageiros: number
  impostoLucroPercent?: number
}): TotaisCalculados {
  const valorCustoTotal = params.servicos.reduce((acc, item) => {
    const custo =
      Number(item.valor_custo_total) ||
      (Number(item.valor_unitario) || 0) * (Number(item.quantidade) || 1)
    return acc + custo
  }, 0)

  const margem = Number(params.margemLucroPercent) || 0
  const valorMargemLucro = (valorCustoTotal * margem) / 100
  const valorSubtotalComMargem = valorCustoTotal + valorMargemLucro

  const aliquotaImpostoLucro =
    params.impostoLucroPercent !== undefined ? Number(params.impostoLucroPercent) : 6
  const valorImpostoLucro = (valorMargemLucro * (aliquotaImpostoLucro || 0)) / 100
  const valorLucroLiquido = valorMargemLucro - valorImpostoLucro
  const margemLiquidaCheiaPercent =
    valorSubtotalComMargem > 0 ? (valorLucroLiquido / valorSubtotalComMargem) * 100 : 0

  const taxas = Number(params.taxasAdicionais) || 0
  const desconto = Number(params.desconto) || 0

  const valorFinalVenda = Math.max(0, valorSubtotalComMargem + taxas - desconto)
  const passageiros = Math.max(1, Number(params.numPassageiros) || 1)
  const valorPorPessoa = valorFinalVenda / passageiros

  return {
    valorCustoTotal,
    valorMargemLucro,
    valorSubtotalComMargem,
    aliquotaImpostoLucro,
    valorImpostoLucro,
    valorLucroLiquido,
    margemLiquidaCheiaPercent,
    valorTaxas: taxas,
    valorDesconto: desconto,
    valorFinalVenda,
    valorPorPessoa,
  }
}
