export type ServicoCategoria =
  | 'passagem_aerea'
  | 'hospedagem'
  | 'traslado'
  | 'passeio'
  | 'seguro_viagem'
  | 'aluguel_carro'
  | 'cruzeiro'
  | 'trem'
  | 'taxas_visto'
  | 'outros'

export interface ServicoItem {
  id: string
  categoria: ServicoCategoria
  nome: string
  descricao?: string
  fornecedor?: string
  quantidade: number
  valor_unitario: number
  valor_custo_total: number
  observacoes?: string
}

export type StatusCotacao = 'rascunho' | 'enviada' | 'aprovada' | 'recusada' | 'finalizada'

export type Moeda = 'BRL' | 'USD' | 'EUR'

export interface Cotacao {
  id?: string
  codigo: string
  cliente_nome: string
  cliente_email?: string
  cliente_telefone?: string
  cliente_cpf_passaporte?: string
  destino: string
  data_ida?: string
  data_volta?: string
  num_passageiros: number
  num_criancas: number
  status: StatusCotacao
  servicos: ServicoItem[]
  margem_lucro: number // em porcentagem, e.g. 15%
  desconto: number
  taxas_adicionais: number
  moeda: Moeda
  cotacao_moeda: number
  valor_custo_total: number
  valor_lucro: number
  valor_venda_total: number
  observacoes?: string
  condicoes_gerais?: string
  formas_pagamento?: string
  validade_dias: number
  data_validade?: string
  created?: string
  updated?: string
}

export interface ConfiguracoesAgencia {
  id?: string
  nome_agencia: string
  cnpj_cadastur?: string
  email_contato?: string
  telefone_contato?: string
  whatsapp?: string
  endereco?: string
  site_instagram?: string
  logo_url?: string
  logo_base64?: string
  margem_padrao?: number
  validade_padrao_dias?: number
  condicoes_padrao?: string
  formas_pagamento_padrao?: string
  mensagem_agradecimento?: string
  created?: string
  updated?: string
}

export const CATEGORIAS_SERVICO: {
  value: ServicoCategoria
  label: string
  icon: string
  cor: string
}[] = [
  {
    value: 'passagem_aerea',
    label: 'Passagem Aérea',
    icon: 'Plane',
    cor: 'bg-sky-500/10 text-sky-700 border-sky-200',
  },
  {
    value: 'hospedagem',
    label: 'Hospedagem / Hotel',
    icon: 'Hotel',
    cor: 'bg-indigo-500/10 text-indigo-700 border-indigo-200',
  },
  {
    value: 'traslado',
    label: 'Traslado / Transfer',
    icon: 'Car',
    cor: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  },
  {
    value: 'passeio',
    label: 'Passeio / Tour / Ingressos',
    icon: 'Compass',
    cor: 'bg-amber-500/10 text-amber-700 border-amber-200',
  },
  {
    value: 'seguro_viagem',
    label: 'Seguro Viagem',
    icon: 'ShieldCheck',
    cor: 'bg-teal-500/10 text-teal-700 border-teal-200',
  },
  {
    value: 'aluguel_carro',
    label: 'Aluguel de Veículo',
    icon: 'KeySquare',
    cor: 'bg-blue-500/10 text-blue-700 border-blue-200',
  },
  {
    value: 'cruzeiro',
    label: 'Cruzeiro Marítimo',
    icon: 'Ship',
    cor: 'bg-cyan-500/10 text-cyan-700 border-cyan-200',
  },
  {
    value: 'trem',
    label: 'Trem / Transporte Ferroviário',
    icon: 'Train',
    cor: 'bg-purple-500/10 text-purple-700 border-purple-200',
  },
  {
    value: 'taxas_visto',
    label: 'Taxas Consulares / Vistos',
    icon: 'FileText',
    cor: 'bg-orange-500/10 text-orange-700 border-orange-200',
  },
  {
    value: 'outros',
    label: 'Outros Serviços',
    icon: 'Package',
    cor: 'bg-slate-500/10 text-slate-700 border-slate-200',
  },
]

export const STATUS_COTACAO_CONFIG: Record<
  StatusCotacao,
  {
    label: string
    variant: 'default' | 'secondary' | 'outline' | 'destructive'
    badgeClass: string
  }
> = {
  rascunho: {
    label: 'Rascunho',
    variant: 'secondary',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  enviada: {
    label: 'Enviada ao Cliente',
    variant: 'outline',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-300',
  },
  aprovada: {
    label: 'Aprovada / Fechada',
    variant: 'default',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  recusada: {
    label: 'Não Fechada',
    variant: 'destructive',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-300',
  },
  finalizada: {
    label: 'Viagem Concluída',
    variant: 'default',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
}
