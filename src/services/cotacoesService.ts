import pb from '@/lib/pocketbase/client'
import { Cotacao, ConfiguracoesAgencia, ServicoItem, OpcaoVoo } from '@/types/cotacao'

export function mapRecordToOpcaoVoo(record: Record<string, unknown>): OpcaoVoo {
  const margemRaw = record.margem_desejada
  const margemDesejada =
    margemRaw !== undefined && margemRaw !== null && margemRaw !== '' ? Number(margemRaw) : 15

  return {
    id: record.id as string,
    cotacao_id: (record.cotacao_id as string) || '',
    descricao: (record.descricao as string) || '',
    companhia: (record.companhia as string) || '',
    numero_voo: (record.numero_voo as string) || '',
    data_voo: (record.data_voo as string) || '',
    horario_partida: (record.horario_partida as string) || '',
    horario_chegada: (record.horario_chegada as string) || '',
    origem: (record.origem as string) || '',
    destino: (record.destino as string) || '',
    status: (record.status as OpcaoVoo['status']) || 'Recomendada',
    custo: Number(record.custo) || 0,
    margem_desejada: isNaN(margemDesejada) ? 15 : margemDesejada,
    imposto_percentual:
      record.imposto_percentual !== undefined &&
      record.imposto_percentual !== null &&
      record.imposto_percentual !== ''
        ? Number(record.imposto_percentual)
        : 6,
    preco_mercado:
      record.preco_mercado !== undefined &&
      record.preco_mercado !== null &&
      record.preco_mercado !== ''
        ? Number(record.preco_mercado)
        : undefined,
    modo_precificacao: (record.modo_precificacao as OpcaoVoo['modo_precificacao']) || 'margem',
    desconto_mercado_percentual:
      record.desconto_mercado_percentual !== undefined &&
      record.desconto_mercado_percentual !== null &&
      record.desconto_mercado_percentual !== ''
        ? Number(record.desconto_mercado_percentual)
        : undefined,
    ordem: Number(record.ordem) || 0,
    created: (record.created as string) || '',
    updated: (record.updated as string) || '',
  }
}

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
    modo_precificacao: (record.modo_precificacao as Cotacao['modo_precificacao']) || 'margem',
    margem_lucro: Number(record.margem_lucro) || 0,
    desconto_mercado_percentual:
      record.desconto_mercado_percentual !== undefined &&
      record.desconto_mercado_percentual !== null &&
      record.desconto_mercado_percentual !== ''
        ? Number(record.desconto_mercado_percentual)
        : undefined,
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

export const opcoesVooService = {
  async listarPorCotacao(cotacaoId: string): Promise<OpcaoVoo[]> {
    try {
      const records = await pb.collection('opcoes_voo').getFullList({
        filter: `cotacao_id = "${cotacaoId}"`,
        sort: 'ordem,created',
      })
      return records.map((r) => mapRecordToOpcaoVoo(r as unknown as Record<string, unknown>))
    } catch (err) {
      console.error('Erro ao listar opções de voo:', err)
      return []
    }
  },

  async sincronizarParaCotacao(
    cotacaoId: string,
    opcoes: Omit<OpcaoVoo, 'id' | 'created' | 'updated' | 'cotacao_id'>[],
  ): Promise<OpcaoVoo[]> {
    try {
      // Buscar opções existentes
      const existentes = await pb.collection('opcoes_voo').getFullList({
        filter: `cotacao_id = "${cotacaoId}"`,
      })

      // Excluir todas as anteriores para recriar na ordem exata
      for (const item of existentes) {
        await pb.collection('opcoes_voo').delete(item.id)
      }

      const criadas: OpcaoVoo[] = []
      for (let i = 0; i < opcoes.length; i++) {
        const op = opcoes[i]
        const margemOp =
          op.margem_desejada !== undefined &&
          op.margem_desejada !== null &&
          (op.margem_desejada as any) !== ''
            ? Number(op.margem_desejada)
            : 15
        const impostoOp =
          op.imposto_percentual !== undefined &&
          op.imposto_percentual !== null &&
          (op.imposto_percentual as any) !== ''
            ? Number(op.imposto_percentual)
            : 6

        const rec = await pb.collection('opcoes_voo').create({
          cotacao_id: cotacaoId,
          descricao:
            op.descricao || `${op.companhia || 'Voo'} • ${op.origem || ''} → ${op.destino || ''}`,
          companhia: op.companhia || '',
          numero_voo: op.numero_voo || '',
          data_voo: op.data_voo || '',
          horario_partida: op.horario_partida || '',
          horario_chegada: op.horario_chegada || '',
          origem: op.origem || '',
          destino: op.destino || '',
          status: op.status || (i === 0 ? 'Recomendada' : 'Alternativa'),
          custo: Number(op.custo) || 0,
          margem_desejada: isNaN(margemOp) ? 15 : margemOp,
          imposto_percentual: isNaN(impostoOp) ? 6 : impostoOp,
          preco_mercado:
            op.preco_mercado !== undefined &&
            op.preco_mercado !== null &&
            (op.preco_mercado as any) !== ''
              ? Number(op.preco_mercado)
              : null,
          modo_precificacao: op.modo_precificacao || 'margem',
          desconto_mercado_percentual:
            op.desconto_mercado_percentual !== undefined &&
            op.desconto_mercado_percentual !== null &&
            (op.desconto_mercado_percentual as any) !== ''
              ? Number(op.desconto_mercado_percentual)
              : null,
          ordem: i,
        })
        criadas.push(mapRecordToOpcaoVoo(rec as unknown as Record<string, unknown>))
      }

      return criadas
    } catch (err) {
      console.error('Erro ao sincronizar opções de voo:', err)
      return []
    }
  },
}

export function gerarOpcaoPadraoLegada(cotacao: Cotacao): OpcaoVoo {
  // Procura se tem serviço de passagem aérea para pegar dados
  const servicoAereo = cotacao.servicos.find((s) => s.categoria === 'passagem_aerea')
  const custoAereo = servicoAereo
    ? Number(servicoAereo.valor_custo_total) || 0
    : cotacao.valor_custo_total || 0

  const margem =
    cotacao.margem_lucro !== undefined && cotacao.margem_lucro !== null
      ? Number(cotacao.margem_lucro)
      : 15

  return {
    id: `legado-${cotacao.id || Date.now()}`,
    cotacao_id: cotacao.id,
    descricao: servicoAereo?.nome || `Opção Principal • ${cotacao.destino}`,
    companhia: servicoAereo?.fornecedor || 'Companhia Aérea',
    numero_voo: '',
    data_voo: cotacao.data_ida || '',
    horario_partida: '',
    horario_chegada: '',
    origem: 'São Paulo (GRU)',
    destino: cotacao.destino || '',
    status: 'Recomendada',
    custo: custoAereo,
    margem_desejada: isNaN(margem) ? 15 : margem,
    imposto_percentual: 6,
    preco_mercado: cotacao.preco_mercado,
    modo_precificacao: cotacao.modo_precificacao || 'margem',
    desconto_mercado_percentual:
      cotacao.desconto_mercado_percentual !== undefined &&
      cotacao.desconto_mercado_percentual !== null
        ? Number(cotacao.desconto_mercado_percentual)
        : 10,
    ordem: 0,
  }
}

export const cotacoesService = {
  async listar(): Promise<Cotacao[]> {
    try {
      const records = await pb.collection('cotacoes').getFullList({
        sort: '-created',
      })
      const cotacoes = records.map((r) =>
        mapRecordToCotacao(r as unknown as Record<string, unknown>),
      )

      // Carregar opções de voo para todas as cotações
      try {
        const todasOpcoes = await pb.collection('opcoes_voo').getFullList({
          sort: 'ordem,created',
        })
        const opcoesPorCotacao: Record<string, OpcaoVoo[]> = {}
        for (const opRec of todasOpcoes) {
          const op = mapRecordToOpcaoVoo(opRec as unknown as Record<string, unknown>)
          if (op.cotacao_id) {
            if (!opcoesPorCotacao[op.cotacao_id]) {
              opcoesPorCotacao[op.cotacao_id] = []
            }
            opcoesPorCotacao[op.cotacao_id].push(op)
          }
        }

        for (const c of cotacoes) {
          if (c.id && opcoesPorCotacao[c.id] && opcoesPorCotacao[c.id].length > 0) {
            c.opcoes_voo = opcoesPorCotacao[c.id]
          } else {
            // Compatibilidade com cotações antigas sem opções
            c.opcoes_voo = [gerarOpcaoPadraoLegada(c)]
          }
        }
      } catch (errOp) {
        console.warn('Erro ao carregar opções de voo na listagem:', errOp)
        for (const c of cotacoes) {
          if (!c.opcoes_voo || c.opcoes_voo.length === 0) {
            c.opcoes_voo = [gerarOpcaoPadraoLegada(c)]
          }
        }
      }

      return cotacoes
    } catch (err) {
      console.error('Erro ao listar cotações:', err)
      return []
    }
  },

  async buscarPorId(id: string): Promise<Cotacao | null> {
    try {
      const record = await pb.collection('cotacoes').getOne(id)
      const cotacao = mapRecordToCotacao(record as unknown as Record<string, unknown>)
      const opcoes = await opcoesVooService.listarPorCotacao(id)
      if (opcoes.length > 0) {
        cotacao.opcoes_voo = opcoes
      } else {
        cotacao.opcoes_voo = [gerarOpcaoPadraoLegada(cotacao)]
      }
      return cotacao
    } catch (err) {
      console.error('Erro ao buscar cotação:', err)
      return null
    }
  },

  async criar(
    dados: Omit<Cotacao, 'id' | 'created' | 'updated'> & { opcoes_voo?: OpcaoVoo[] },
  ): Promise<Cotacao> {
    const { opcoes_voo, ...dadosCotacao } = dados
    const payload = {
      ...dadosCotacao,
      servicos: dadosCotacao.servicos || [],
    }
    const record = await pb.collection('cotacoes').create(payload)
    const cotacaoCriada = mapRecordToCotacao(record as unknown as Record<string, unknown>)

    if (opcoes_voo && opcoes_voo.length > 0 && cotacaoCriada.id) {
      const salvas = await opcoesVooService.sincronizarParaCotacao(cotacaoCriada.id, opcoes_voo)
      cotacaoCriada.opcoes_voo = salvas
    } else if (cotacaoCriada.id) {
      cotacaoCriada.opcoes_voo = [gerarOpcaoPadraoLegada(cotacaoCriada)]
    }

    return cotacaoCriada
  },

  async atualizar(id: string, dados: Partial<Cotacao>): Promise<Cotacao> {
    const { opcoes_voo, ...dadosCotacao } = dados
    const payload = { ...dadosCotacao }
    const record = await pb.collection('cotacoes').update(id, payload)
    const cotacaoAtualizada = mapRecordToCotacao(record as unknown as Record<string, unknown>)

    if (opcoes_voo !== undefined) {
      const salvas = await opcoesVooService.sincronizarParaCotacao(id, opcoes_voo)
      cotacaoAtualizada.opcoes_voo = salvas
    } else {
      const opcoes = await opcoesVooService.listarPorCotacao(id)
      cotacaoAtualizada.opcoes_voo =
        opcoes.length > 0 ? opcoes : [gerarOpcaoPadraoLegada(cotacaoAtualizada)]
    }

    return cotacaoAtualizada
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
      cnpj_cadastur: '',
      email_contato: '',
      telefone_contato: '',
      whatsapp: '',
      endereco: '',
      site_instagram: '',
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

    const telContato = dados.telefone_contato ? String(dados.telefone_contato).trim() : ''
    formData.append('nome_agencia', (dados.nome_agencia || 'Sua Agência de Viagens').trim())
    formData.append('cnpj_cadastur', dados.cnpj_cadastur ? String(dados.cnpj_cadastur).trim() : '')
    formData.append('email_contato', dados.email_contato ? String(dados.email_contato).trim() : '')
    formData.append('telefone_contato', telContato)
    formData.append('whatsapp', dados.whatsapp ? String(dados.whatsapp).trim() : telContato)
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
