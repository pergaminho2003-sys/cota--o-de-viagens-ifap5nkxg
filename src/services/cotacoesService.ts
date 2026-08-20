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
    preco_mercado:
      record.preco_mercado !== undefined &&
      record.preco_mercado !== null &&
      record.preco_mercado !== ''
        ? Number(record.preco_mercado)
        : undefined,
    margem_minima_aceitavel:
      record.margem_minima_aceitavel !== undefined &&
      record.margem_minima_aceitavel !== null &&
      record.margem_minima_aceitavel !== ''
        ? Number(record.margem_minima_aceitavel)
        : undefined,
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
        const logoFile = (r.logo as string) || ''
        let resolvedLogoUrl = (r.logo_url as string) || ''
        if (logoFile) {
          resolvedLogoUrl = pb.files.getUrl(r, logoFile)
        }
        return {
          id: r.id,
          nome_agencia: r.nome_agencia || 'Sua Agência de Viagens',
          cnpj_cadastur: r.cnpj_cadastur || '',
          email_contato: r.email_contato || '',
          telefone_contato: r.telefone_contato || '',
          whatsapp: r.whatsapp || '',
          endereco: r.endereco || '',
          site_instagram: r.site_instagram || '',
          logo: logoFile,
          logo_url: resolvedLogoUrl,
          margem_padrao: Number(r.margem_padrao) || 15,
          imposto_lucro_padrao:
            r.imposto_lucro_padrao !== undefined &&
            r.imposto_lucro_padrao !== null &&
            r.imposto_lucro_padrao !== ''
              ? Number(r.imposto_lucro_padrao)
              : 6,
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
      imposto_lucro_padrao: 6,
      validade_padrao_dias: 7,
      condicoes_padrao:
        '• Valores sujeitos a alteração e disponibilidade sem aviso prévio até a confirmação da reserva.\n• Tarifas aéreas e de hospedagem não reembolsáveis conforme regras de cada fornecedor.\n• Documentação pessoal, passaportes com validade mínima de 6 meses e vistos são de responsabilidade do passageiro.',
      formas_pagamento_padrao:
        '• Entrada de 20% no PIX ou transferência + saldo em até 10x sem juros no cartão de crédito.\n• Desconto especial de 5% para pagamento à vista via PIX.',
      mensagem_agradecimento:
        'Agradecemos a oportunidade de planejar a sua viagem dos sonhos. Estamos à disposição para qualquer ajuste!',
    }
  },

  async salvar(
    dados: ConfiguracoesAgencia,
    arquivoLogo?: File | null,
  ): Promise<ConfiguracoesAgencia> {
    const formData = new FormData()

    formData.append('nome_agencia', (dados.nome_agencia || 'Sua Agência de Viagens').trim())
    formData.append('cnpj_cadastur', dados.cnpj_cadastur ? String(dados.cnpj_cadastur).trim() : '')
    formData.append('email_contato', dados.email_contato ? String(dados.email_contato).trim() : '')
    formData.append(
      'telefone_contato',
      dados.telefone_contato ? String(dados.telefone_contato).trim() : '',
    )
    formData.append('whatsapp', dados.whatsapp ? String(dados.whatsapp).trim() : '')
    formData.append('endereco', dados.endereco ? String(dados.endereco).trim() : '')
    formData.append(
      'site_instagram',
      dados.site_instagram ? String(dados.site_instagram).trim() : '',
    )
    formData.append('margem_padrao', String(Math.max(0, Number(dados.margem_padrao) || 0)))
    formData.append(
      'imposto_lucro_padrao',
      String(Math.max(0, Number(dados.imposto_lucro_padrao) || 0)),
    )
    formData.append(
      'validade_padrao_dias',
      String(Math.max(1, Math.round(Number(dados.validade_padrao_dias) || 7))),
    )
    formData.append(
      'condicoes_padrao',
      dados.condicoes_padrao ? String(dados.condicoes_padrao).trim() : '',
    )
    formData.append(
      'formas_pagamento_padrao',
      dados.formas_pagamento_padrao ? String(dados.formas_pagamento_padrao).trim() : '',
    )
    formData.append(
      'mensagem_agradecimento',
      dados.mensagem_agradecimento ? String(dados.mensagem_agradecimento).trim() : '',
    )

    // Se um novo arquivo de logo for enviado
    if (arquivoLogo instanceof File) {
      formData.append('logo', arquivoLogo)
      formData.append('logo_url', '')
    } else if (arquivoLogo === null) {
      // Remover logo existente
      formData.append('logo', '')
      formData.append('logo_url', '')
    } else if (dados.logo_url) {
      // Manter ou atualizar URL externa
      formData.append('logo_url', String(dados.logo_url).trim())
    }

    const tentarSalvarOuAtualizar = async (recordId?: string) => {
      if (recordId) {
        return await pb.collection('configuracoes_agencia').update(recordId, formData)
      } else {
        const list = await pb
          .collection('configuracoes_agencia')
          .getList(1, 1, { sort: '-created' })
        if (list.items.length > 0) {
          return await pb.collection('configuracoes_agencia').update(list.items[0].id, formData)
        } else {
          return await pb.collection('configuracoes_agencia').create(formData)
        }
      }
    }

    try {
      const rec = await tentarSalvarOuAtualizar(dados.id)
      const logoFile = (rec.logo as string) || ''
      const resolvedLogoUrl = logoFile
        ? pb.files.getUrl(rec, logoFile)
        : (rec.logo_url as string) || ''

      return {
        ...dados,
        id: rec.id,
        logo: logoFile,
        logo_url: resolvedLogoUrl,
        created: rec.created,
        updated: rec.updated,
      } as ConfiguracoesAgencia
    } catch (err: unknown) {
      const pbErr = err as {
        status?: number
        message?: string
        data?: Record<string, unknown>
        response?: Record<string, unknown>
      }

      console.error('[configAgenciaService.salvar] Erro detalhado do PocketBase:', {
        status: pbErr?.status,
        message: pbErr?.message,
        data: pbErr?.data,
        response: pbErr?.response,
        fullError: err,
      })

      // Fallback: buscar o registro mais recente do servidor e tentar novamente
      try {
        console.warn(
          '[configAgenciaService.salvar] Tentando fallback de sincronização com o servidor...',
        )
        const records = await pb
          .collection('configuracoes_agencia')
          .getList(1, 1, { sort: '-created' })
        if (records.items.length > 0) {
          const first = records.items[0]
          const rec = await pb.collection('configuracoes_agencia').update(first.id, formData)
          const logoFile = (rec.logo as string) || ''
          const resolvedLogoUrl = logoFile
            ? pb.files.getUrl(rec, logoFile)
            : (rec.logo_url as string) || ''

          return {
            ...dados,
            id: rec.id,
            logo: logoFile,
            logo_url: resolvedLogoUrl,
            created: rec.created,
            updated: rec.updated,
          } as ConfiguracoesAgencia
        } else {
          const rec = await pb.collection('configuracoes_agencia').create(formData)
          const logoFile = (rec.logo as string) || ''
          const resolvedLogoUrl = logoFile
            ? pb.files.getUrl(rec, logoFile)
            : (rec.logo_url as string) || ''

          return {
            ...dados,
            id: rec.id,
            logo: logoFile,
            logo_url: resolvedLogoUrl,
            created: rec.created,
            updated: rec.updated,
          } as ConfiguracoesAgencia
        }
      } catch (fallbackErr: unknown) {
        console.error('[configAgenciaService.salvar] Erro no fallback detalhado:', fallbackErr)
        throw fallbackErr
      }
    }
  },
}
