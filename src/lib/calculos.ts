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
  margemBrutaModoAPercent: number
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
  margemBrutaModoBPercent: number
  impostoModoB: number
  lucroLiquidoModoB: number
  margemRealResultanteModoBPercent: number
  margemLiquidaModoBPercent: number
  economiaModoBReais: number
  economiaModoBPercent: number
  // Valores Efetivos baseados no modo selecionado + taxas e desconto avulso
  valorMargemLucro: number // Lucro bruto em R$
  margemBrutaEfetivaPercent: number // Margem bruta em %
  valorSubtotalComMargem: number
  valorImpostoLucro: number
  valorLucroLiquido: number // Lucro líquido em R$
  margemLiquidaEfetivaPercent: number // Margem líquida em %
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
  margemBrutaPercent: number
  margemRealPercent: number // mantido para compatibilidade
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
  margemBrutaPercent: number
  imposto: number
  lucroLiquido: number
  margemRealResultantePercent: number
  margemLiquidaPercent: number
  economiaClienteReais: number
  economiaClientePercent: number
  valido: boolean
}

export interface CalculoOpcaoVooResult {
  modoPrecificacao: ModoPrecificacao
  custo: number
  precoFinal: number
  lucroBruto: number
  margemBrutaPercent: number
  imposto: number
  lucroLiquido: number
  margemLiquidaPercent: number
  economiaClienteReais: number
  economiaClientePercent: number
  temVantagemComercial: boolean
  cenarioA: CenarioPrecificacaoModoA
  cenarioB: CenarioPrecificacaoModoB
}

/**
 * Determina o índice da opção "Mais barata" em um conjunto de opções de voo.
 * Critérios:
 * 1. Compara o Preço final (valor de venda ao cliente) de todas as opções de voo daquela cotação.
 * 2. Aplica a tag "Mais barata" somente na opção com o menor Preço final.
 * 3. Se houver empate exato (diferença < 0.01) entre duas ou mais opções com menor preço, nenhuma recebe a tag.
 * 4. Se houver só uma opção de voo na cotação (opcoes.length <= 1), não exibir nenhuma tag (retorna null).
 */
export function encontrarIndiceOpcaoMaisBarata(
  opcoes: Array<{
    custo: number
    margem_desejada: number
    imposto_percentual: number
    preco_mercado?: number
    modo_precificacao: ModoPrecificacao
    desconto_mercado_percentual?: number
  }>,
): number | null {
  if (!opcoes || opcoes.length <= 1) {
    return null
  }

  const precosFinais = opcoes.map((op) => {
    const calc = calcularOpcaoVoo(op)
    return calc.precoFinal
  })

  let menorPreco = Infinity
  let indiceMenor = -1
  let qtdEmpate = 0

  precosFinais.forEach((preco, index) => {
    // Tolerância para float: 0.005
    if (preco < menorPreco - 0.005) {
      menorPreco = preco
      indiceMenor = index
      qtdEmpate = 1
    } else if (Math.abs(preco - menorPreco) <= 0.005) {
      qtdEmpate++
    }
  })

  // Se houver empate no menor preço ou nenhuma opção válida
  if (qtdEmpate > 1 || indiceMenor === -1) {
    return null
  }

  return indiceMenor
}

export function calcularOpcaoVoo(opcao: {
  custo: number
  margem_desejada: number
  imposto_percentual: number
  preco_mercado?: number
  modo_precificacao: ModoPrecificacao
  desconto_mercado_percentual?: number
}): CalculoOpcaoVooResult {
  const custo = Math.max(0, Number(opcao.custo) || 0)
  const margemDesejada = Number(opcao.margem_desejada) || 0
  const impostoPercent = Number(opcao.imposto_percentual) || 0
  const precoMercado =
    opcao.preco_mercado !== undefined &&
    opcao.preco_mercado !== null &&
    !isNaN(Number(opcao.preco_mercado)) &&
    Number(opcao.preco_mercado) > 0
      ? Number(opcao.preco_mercado)
      : undefined
  const descontoMercado = Number(opcao.desconto_mercado_percentual) || 0
  const modo = opcao.modo_precificacao || 'margem'

  const cenarioA = calcularCenarioModoA({
    custoTotal: custo,
    margemPercent: margemDesejada,
    impostoPercent: impostoPercent,
    precoMercado,
  })

  const cenarioB = calcularCenarioModoB({
    custoTotal: custo,
    precoMercado,
    descontoPercent: descontoMercado,
    impostoPercent: impostoPercent,
  })

  if (modo === 'desconto_mercado' && cenarioB.valido) {
    return {
      modoPrecificacao: 'desconto_mercado',
      custo,
      precoFinal: cenarioB.precoFinal,
      lucroBruto: cenarioB.lucroBruto,
      margemBrutaPercent: cenarioB.margemBrutaPercent,
      imposto: cenarioB.imposto,
      lucroLiquido: cenarioB.lucroLiquido,
      margemLiquidaPercent: cenarioB.margemLiquidaPercent,
      economiaClienteReais: cenarioB.economiaClienteReais,
      economiaClientePercent: cenarioB.economiaClientePercent,
      temVantagemComercial: cenarioB.economiaClienteReais > 0,
      cenarioA,
      cenarioB,
    }
  }

  return {
    modoPrecificacao: 'margem',
    custo,
    precoFinal: cenarioA.precoFinal,
    lucroBruto: cenarioA.lucroBruto,
    margemBrutaPercent: cenarioA.margemBrutaPercent,
    imposto: cenarioA.imposto,
    lucroLiquido: cenarioA.lucroLiquido,
    margemLiquidaPercent: cenarioA.margemLiquidaPercent,
    economiaClienteReais: cenarioA.economiaClienteReais,
    economiaClientePercent: cenarioA.economiaClientePercent,
    temVantagemComercial: cenarioA.temEconomia,
    cenarioA,
    cenarioB,
  }
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

  // Modo A: Preço final = Custo ÷ (1 − margem % desejada)
  // Se margem >= 100%, limitamos o denominador para evitar divisão por zero ou negativa
  const fatorDivisor = margem >= 100 ? 0.0001 : 1 - margem / 100
  const precoFinal = custo > 0 ? (fatorDivisor > 0 ? custo / fatorDivisor : 0) : 0

  // Margem Bruta (antes do imposto): Preço final − Custo em R$, e (Preço final − Custo) ÷ Preço final em %
  const lucroBruto = Math.max(0, precoFinal - custo)
  const margemBrutaPercent = precoFinal > 0 ? (lucroBruto / precoFinal) * 100 : margem

  // Imposto: Margem Bruta em R$ × imposto %
  const imposto = lucroBruto * aliquotaImposto

  // Margem Líquida (pós-imposto): Margem Bruta em R$ − Imposto em R$, e Margem Líquida em R$ ÷ Preço final em %
  const lucroLiquido = Math.max(0, lucroBruto - imposto)
  const margemLiquidaPercent = precoFinal > 0 ? (lucroLiquido / precoFinal) * 100 : 0
  const margemRealPercent = margemBrutaPercent

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
    margemBrutaPercent,
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

  // Margem bruta = Preço final - Custo
  const lucroBruto = Math.max(0, precoFinal - custo)
  const margemBrutaPercent = precoFinal > 0 ? (lucroBruto / precoFinal) * 100 : 0

  // Imposto = Margem Bruta em R$ × aliquota_imposto
  const imposto = lucroBruto * aliquotaImposto
  const lucroLiquido = Math.max(0, lucroBruto - imposto)

  // Margem real resultante = (Preço final − Custo − Imposto) ÷ Preço final
  const margemRealResultantePercent = precoFinal > 0 ? (lucroLiquido / precoFinal) * 100 : 0

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
    margemBrutaPercent,
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
  let margemBrutaEfetivaPercent = 0
  let valorImpostoLucro = 0
  let valorLucroLiquido = 0
  let margemLiquidaEfetivaPercent = 0
  let economiaClienteReais = 0
  let economiaClientePercent = 0
  let temVantagemComercial = false

  if (modoPrecificacao === 'desconto_mercado' && cenarioB.valido) {
    precoBaseModo = cenarioB.precoFinal
    valorMargemLucro = cenarioB.lucroBruto
    margemBrutaEfetivaPercent = cenarioB.margemBrutaPercent
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
    margemBrutaEfetivaPercent = cenarioA.margemBrutaPercent
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
    margemBrutaModoAPercent: cenarioA.margemBrutaPercent,
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
    margemBrutaModoBPercent: cenarioB.margemBrutaPercent,
    impostoModoB: cenarioB.imposto,
    lucroLiquidoModoB: cenarioB.lucroLiquido,
    margemRealResultanteModoBPercent: cenarioB.margemRealResultantePercent,
    margemLiquidaModoBPercent: cenarioB.margemLiquidaPercent,
    economiaModoBReais: cenarioB.economiaClienteReais,
    economiaModoBPercent: cenarioB.economiaClientePercent,
    // Efetivos
    valorMargemLucro,
    margemBrutaEfetivaPercent,
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
