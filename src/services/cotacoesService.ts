import pb from '@/lib/pocketbase/client'
import { Cotacao, ConfiguracoesAgencia, ServicoItem } from '@/types/cotacao'

function parseServicos(data: unknown): ServicoItem[] {
  if (!data) return []
  if (Array.isArray(data)) return data as ServicoItem[]
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function mapRecordToCotacao(record: Record<string, unknown>): Cotacao {
  return {
    id: record.id as string,
    codigo: (record.codigo as string) || `COT-${new Date().getFullYear()}-000`,
    cliente_nome: (record.cliente_nome as string) || '',
    cliente_email: (record.cliente_email as string) || '',
    cliente_telefone: (record.cliente_telefone as string) || '',
    cliente_cpf_passaporte: (record.cliente_cpf_passaporte as string) || '',
    destino: (record.destino as string) || '',
    data_ida: (record.data_ida as string) || '',
    data_volta: (record.data_volta as string) || '',
    num_passageiros: Number(record.num_passageiros) || 1,
    num_criancas: Number(record.num_criancas) || 0,
    status: (record.status as Cotacao['status']) || 'rascunho',
    servicos: parseServicos(record.servicos),
    margem_lucro: Number(record.margem_lucro) || 0,
    desconto: Number(record.desconto) || 0,
    taxas_adicionais: Number(record.taxas_adicionais) || 0,
    moeda: (record.moeda as Cotacao['moeda']) || 'BRL',
    cotacao_moeda: Number(record.cotacao_moeda) || 1,
    valor_custo_total: Number(record.valor_custo_total) || 0,
    valor_lucro: Number(record.valor_lucro) || 0,
    valor_venda_total: Number(record.valor_venda_total) || 0,
    observacoes: (record.observacoes as string) || '',
    condicoes_gerais: (record.condicoes_gerais as string) || '',
    formas_pagamento: (record.formas_pagamento as string) || '',
    validade_dias: Number(record.validade_dias) || 7,
    data_validade: (record.data_validade as string) || '',
    created: (record.created as string) || '',
    updated: (record.updated as string) || '',
  }
}

export const cotacoesService = {
  async listar(): Promise<Cotacao[]> {
    try {
      const records = await pb.collection('cotacoes').getFullList({
        sort: '-created',
      })
      return records.map((r) => mapRecordToCotacao(r as unknown as Record<string, unknown>))
    } catch (err) {
      console.error('Erro ao listar cotações:', err)
      return []
    }
  },

  async buscarPorId(id: string): Promise<Cotacao | null> {
    try {
      const record = await pb.collection('cotacoes').getOne(id)
      return mapRecordToCotacao(record as unknown as Record<string, unknown>)
    } catch (err) {
      console.error('Erro ao buscar cotação:', err)
      return null
    }
  },

  async criar(dados: Omit<Cotacao, 'id' | 'created' | 'updated'>): Promise<Cotacao> {
    const payload = {
      ...dados,
      servicos: dados.servicos || [],
    }
    const record = await pb.collection('cotacoes').create(payload)
    return mapRecordToCotacao(record as unknown as Record<string, unknown>)
  },

  async atualizar(id: string, dados: Partial<Cotacao>): Promise<Cotacao> {
    const payload = { ...dados }
    const record = await pb.collection('cotacoes').update(id, payload)
    return mapRecordToCotacao(record as unknown as Record<string, unknown>)
  },

  async excluir(id: string): Promise<boolean> {
    try {
      await pb.collection('cotacoes').delete(id)
      return true
    } catch (err) {
      console.error('Erro ao excluir cotação:', err)
      return false
    }
  },

  async gerarProximoCodigo(): Promise<string> {
    try {
      const records = await pb.collection('cotacoes').getList(1, 1, {
        sort: '-created',
      })
      const anoAtual = new Date().getFullYear()
      const total = records.totalItems || 0
      const proximo = String(total + 1).padStart(3, '0')
      return `COT-${anoAtual}-${proximo}`
    } catch {
      const random = Math.floor(100 + Math.random() * 900)
      return `COT-${new Date().getFullYear()}-${random}`
    }
  },
}

export const configAgenciaService = {
  async obter(): Promise<ConfiguracoesAgencia> {
    try {
      const records = await pb.collection('configuracoes_agencia').getList(1, 1, {
        sort: '-created',
      })
      if (records.items.length > 0) {
        const r = records.items[0]
        return {
          id: r.id,
          nome_agencia: r.nome_agencia || 'Sua Agência de Viagens',
          cnpj_cadastur: r.cnpj_cadastur || '',
          email_contato: r.email_contato || '',
          telefone_contato: r.telefone_contato || '',
          whatsapp: r.whatsapp || '',
          endereco: r.endereco || '',
          site_instagram: r.site_instagram || '',
          logo_url: r.logo_url || '',
          logo_base64: r.logo_base64 || '',
          margem_padrao: Number(r.margem_padrao) || 15,
          validade_padrao_dias: Number(r.validade_padrao_dias) || 7,
          condicoes_padrao: r.condicoes_padrao || '',
          formas_pagamento_padrao: r.formas_pagamento_padrao || '',
          mensagem_agradecimento: r.mensagem_agradecimento || '',
          created: r.created,
          updated: r.updated,
        }
      }
    } catch (err) {
      console.warn('Configurações não encontradas no PocketBase, usando padrão local:', err)
    }

    // Fallback padrão
    return {
      nome_agencia: 'Aura Viagens & Turismo',
      cnpj_cadastur: 'CADASTUR: 26.045.892/0001-30',
      email_contato: 'atendimento@auraviagens.com.br',
      telefone_contato: '(11) 3456-7890',
      whatsapp: '(11) 98765-4321',
      endereco: 'Av. Paulista, 1000, Cj. 142 - Bela Vista, São Paulo - SP',
      site_instagram: '@auraviagens | www.auraviagens.com.br',
      margem_padrao: 15,
      validade_padrao_dias: 7,
      condicoes_padrao:
        '• Valores sujeitos a alteração e disponibilidade sem aviso prévio até a confirmação da reserva.\n• Tarifas aéreas e de hospedagem não reembolsáveis conforme regras de cada fornecedor.\n• Documentação pessoal, passaportes com validade mínima de 6 meses e vistos são de responsabilidade do passageiro.',
      formas_pagamento_padrao:
        '• Entrada de 20% no PIX ou transferência + saldo em até 10x sem juros no cartão de crédito.\n• Desconto especial de 5% para pagamento à vista via PIX.',
      mensagem_agradecimento:
        'Agradecemos a oportunidade de planejar a sua viagem dos sonhos. Estamos à disposição para qualquer ajuste!',
    }
  },

  async salvar(dados: ConfiguracoesAgencia): Promise<ConfiguracoesAgencia> {
    try {
      if (dados.id) {
        const rec = await pb.collection('configuracoes_agencia').update(dados.id, dados)
        return { ...dados, ...rec }
      } else {
        const records = await pb.collection('configuracoes_agencia').getList(1, 1)
        if (records.items.length > 0) {
          const first = records.items[0]
          const rec = await pb.collection('configuracoes_agencia').update(first.id, dados)
          return { ...dados, id: first.id, ...rec }
        } else {
          const rec = await pb.collection('configuracoes_agencia').create(dados)
          return { ...dados, id: rec.id, ...rec }
        }
      }
    } catch (err) {
      console.error('Erro ao salvar configurações da agência:', err)
      throw err
    }
  },
}
