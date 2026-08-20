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

import { ModoPrecificacao } from '@/types/cotacao'

export interface TotaisCalculados {
  modoPrecificacao: ModoPrecificacao
  valorCustoTotal: number
  // Valores do Modo A (Margem)
  margemDesejadaPercent: number
  precoVendaModoA: number
  lucroBrutoModoA: number
  aliquotaImpostoLucro: number
  impostoModoA: number
  lucroLiquidoModoA: number
  margemLiquidaModoAPercent: number
  economiaModoAReais: number
  economiaModoAPercent: number
  // Valores do Modo B (Desconto de Mercado)
  precoMercado?: number
  descontoMercadoPercent: number
  precoVendaModoB: number
  lucroBrutoModoB: number
  impostoModoB: number
  lucroLiquidoModoB: number
  margemRealResultanteModoBPercent: number
  economiaModoBReais: number
  economiaModoBPercent: number
  // Valores Efetivos baseados no modo selecionado + taxas e desconto avulso
  valorMargemLucro: number
  valorSubtotalComMargem: number
  valorImpostoLucro: number
  valorLucroLiquido: number
  margemLiquidaEfetivaPercent: number
  valorTaxas: number
  valorDesconto: number
  valorFinalVenda: number
  valorPorPessoa: number
  economiaClienteReais: number
  economiaClientePercent: number
  temVantagemComercial: boolean
}

export interface CenarioPrecificacaoModoA {
  precoFinal: number
  margemRealPercent: number
  lucroBruto: number
  imposto: number
  lucroLiquido: number
  margemLiquidaPercent: number
  economiaClienteReais: number
  economiaClientePercent: number
  temEconomia: boolean
}

export interface CenarioPrecificacaoModoB {
  precoFinal: number
  descontoAplicadoPercent: number
  precoMercado: number
  lucroBruto: number
  imposto: number
  lucroLiquido: number
  margemRealResultantePercent: number
  margemLiquidaPercent: number
  economiaClienteReais: number
  economiaClientePercent: number
  valido: boolean
}

export function calcularCenarioModoA(params: {
  custoTotal: number
  margemPercent: number
  impostoPercent: number
  precoMercado?: number
}): CenarioPrecificacaoModoA {
  const custo = Math.max(0, Number(params.custoTotal) || 0)
  const margem = Number(params.margemPercent) || 0
  const aliquotaImposto = (Number(params.impostoPercent) || 0) / 100
  const precoMercado =
    params.precoMercado !== undefined &&
    !isNaN(Number(params.precoMercado)) &&
    Number(params.precoMercado) > 0
      ? Number(params.precoMercado)
      : undefined

  // Modo A: Preço final = Custo × (1 + margem % desejada)
  const precoFinal = custo * (1 + margem / 100)
  const lucroBruto = Math.max(0, precoFinal - custo)
  const imposto = lucroBruto * aliquotaImposto
  const lucroLiquido = lucroBruto - imposto
  const margemRealPercent = margem
  const margemLiquidaPercent = precoFinal > 0 ? (lucroLiquido / precoFinal) * 100 : 0

  let economiaClienteReais = 0
  let economiaClientePercent = 0
  let temEconomia = false

  if (precoMercado !== undefined && precoMercado > precoFinal) {
    economiaClienteReais = precoMercado - precoFinal
    economiaClientePercent = (economiaClienteReais / precoMercado) * 100
    temEconomia = true
  }

  return {
    precoFinal,
    margemRealPercent,
    lucroBruto,
    imposto,
    lucroLiquido,
    margemLiquidaPercent,
    economiaClienteReais,
    economiaClientePercent,
    temEconomia,
  }
}

export function calcularCenarioModoB(params: {
  custoTotal: number
  precoMercado?: number
  descontoPercent: number
  impostoPercent: number
}): CenarioPrecificacaoModoB {
  const custo = Math.max(0, Number(params.custoTotal) || 0)
  const precoMercado =
    params.precoMercado !== undefined &&
    !isNaN(Number(params.precoMercado)) &&
    Number(params.precoMercado) > 0
      ? Number(params.precoMercado)
      : 0
  const desconto = Number(params.descontoPercent) || 0
  const aliquotaImposto = (Number(params.impostoPercent) || 0) / 100

  const valido = precoMercado > 0

  // Modo B: Preço final = Preço de mercado × (1 − desconto % que vou dar)
  const precoFinal = valido ? Math.max(0, precoMercado * (1 - desconto / 100)) : 0

  // Lucro bruto = Preço final - Custo
  const lucroBruto = Math.max(0, precoFinal - custo)
  // Imposto = (Preço final − Custo total) × aliquota_imposto
  const imposto = precoFinal - custo > 0 ? (precoFinal - custo) * aliquotaImposto : 0
  const lucroLiquido = precoFinal - custo - imposto

  // Margem real resultante = (Preço final − Custo − Imposto) ÷ Preço final
  const margemRealResultantePercent =
    precoFinal > 0 ? ((precoFinal - custo - imposto) / precoFinal) * 100 : 0

  const margemLiquidaPercent = margemRealResultantePercent

  // Economia do cliente = Preço de mercado − Preço final
  const economiaClienteReais = valido ? Math.max(0, precoMercado - precoFinal) : 0
  const economiaClientePercent =
    valido && precoMercado > 0 ? (economiaClienteReais / precoMercado) * 100 : 0

  return {
    precoFinal,
    descontoAplicadoPercent: desconto,
    precoMercado,
    lucroBruto,
    imposto,
    lucroLiquido,
    margemRealResultantePercent,
    margemLiquidaPercent,
    economiaClienteReais,
    economiaClientePercent,
    valido,
  }
}

export function calcularTotaisCotacao(params: {
  servicos: Array<{ valor_custo_total?: number; valor_unitario?: number; quantidade?: number }>
  modoPrecificacao?: ModoPrecificacao
  margemLucroPercent: number
  descontoMercadoPercent?: number
  precoMercado?: number
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

  const modoPrecificacao: ModoPrecificacao = params.modoPrecificacao || 'margem'
  const aliquotaImpostoLucro =
    params.impostoLucroPercent !== undefined ? Number(params.impostoLucroPercent) : 6
  const margemDesejadaPercent = Number(params.margemLucroPercent) || 0
  const descontoMercadoPercent = Number(params.descontoMercadoPercent) || 0

  const precoMercado =
    params.precoMercado !== undefined &&
    !isNaN(Number(params.precoMercado)) &&
    Number(params.precoMercado) > 0
      ? Number(params.precoMercado)
      : undefined

  // Simulação Modo A
  const cenarioA = calcularCenarioModoA({
    custoTotal: valorCustoTotal,
    margemPercent: margemDesejadaPercent,
    impostoPercent: aliquotaImpostoLucro,
    precoMercado,
  })

  // Simulação Modo B
  const cenarioB = calcularCenarioModoB({
    custoTotal: valorCustoTotal,
    precoMercado,
    descontoPercent: descontoMercadoPercent,
    impostoPercent: aliquotaImpostoLucro,
  })

  // Determinar valores conforme modo selecionado
  let precoBaseModo = 0
  let valorMargemLucro = 0
  let valorImpostoLucro = 0
  let valorLucroLiquido = 0
  let margemLiquidaEfetivaPercent = 0
  let economiaClienteReais = 0
  let economiaClientePercent = 0
  let temVantagemComercial = false

  if (modoPrecificacao === 'desconto_mercado' && cenarioB.valido) {
    precoBaseModo = cenarioB.precoFinal
    valorMargemLucro = cenarioB.lucroBruto
    valorImpostoLucro = cenarioB.imposto
    valorLucroLiquido = cenarioB.lucroLiquido
    margemLiquidaEfetivaPercent = cenarioB.margemRealResultantePercent
    economiaClienteReais = cenarioB.economiaClienteReais
    economiaClientePercent = cenarioB.economiaClientePercent
    temVantagemComercial = cenarioB.economiaClienteReais > 0
  } else {
    // Modo Margem (padrão)
    precoBaseModo = cenarioA.precoFinal
    valorMargemLucro = cenarioA.lucroBruto
    valorImpostoLucro = cenarioA.imposto
    valorLucroLiquido = cenarioA.lucroLiquido
    margemLiquidaEfetivaPercent = cenarioA.margemLiquidaPercent
    economiaClienteReais = cenarioA.economiaClienteReais
    economiaClientePercent = cenarioA.economiaClientePercent
    temVantagemComercial = cenarioA.temEconomia
  }

  const taxas = Number(params.taxasAdicionais) || 0
  const desconto = Number(params.desconto) || 0

  const valorSubtotalComMargem = precoBaseModo
  const valorFinalVenda = Math.max(0, precoBaseModo + taxas - desconto)
  const passageiros = Math.max(1, Number(params.numPassageiros) || 1)
  const valorPorPessoa = valorFinalVenda / passageiros

  return {
    modoPrecificacao,
    valorCustoTotal,
    // Modo A
    margemDesejadaPercent,
    precoVendaModoA: cenarioA.precoFinal,
    lucroBrutoModoA: cenarioA.lucroBruto,
    aliquotaImpostoLucro,
    impostoModoA: cenarioA.imposto,
    lucroLiquidoModoA: cenarioA.lucroLiquido,
    margemLiquidaModoAPercent: cenarioA.margemLiquidaPercent,
    economiaModoAReais: cenarioA.economiaClienteReais,
    economiaModoAPercent: cenarioA.economiaClientePercent,
    // Modo B
    precoMercado,
    descontoMercadoPercent,
    precoVendaModoB: cenarioB.precoFinal,
    lucroBrutoModoB: cenarioB.lucroBruto,
    impostoModoB: cenarioB.imposto,
    lucroLiquidoModoB: cenarioB.lucroLiquido,
    margemRealResultanteModoBPercent: cenarioB.margemRealResultantePercent,
    economiaModoBReais: cenarioB.economiaClienteReais,
    economiaModoBPercent: cenarioB.economiaClientePercent,
    // Efetivos
    valorMargemLucro,
    valorSubtotalComMargem,
    valorImpostoLucro,
    valorLucroLiquido,
    margemLiquidaEfetivaPercent,
    valorTaxas: taxas,
    valorDesconto: desconto,
    valorFinalVenda,
    valorPorPessoa,
    economiaClienteReais,
    economiaClientePercent,
    temVantagemComercial,
  }
}
