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
  valorTaxas: number
  valorDesconto: number
  valorFinalVenda: number
  valorPorPessoa: number
}

export function calcularTotaisCotacao(params: {
  servicos: Array<{ valor_custo_total?: number; valor_unitario?: number; quantidade?: number }>
  margemLucroPercent: number
  desconto: number
  taxasAdicionais: number
  numPassageiros: number
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

  const taxas = Number(params.taxasAdicionais) || 0
  const desconto = Number(params.desconto) || 0

  const valorFinalVenda = Math.max(0, valorSubtotalComMargem + taxas - desconto)
  const passageiros = Math.max(1, Number(params.numPassageiros) || 1)
  const valorPorPessoa = valorFinalVenda / passageiros

  return {
    valorCustoTotal,
    valorMargemLucro,
    valorSubtotalComMargem,
    valorTaxas: taxas,
    valorDesconto: desconto,
    valorFinalVenda,
    valorPorPessoa,
  }
}
