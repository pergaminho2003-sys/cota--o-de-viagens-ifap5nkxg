migrate(
  (app) => {
    const cotacoesCol = app.findCollectionByNameOrId('cotacoes')
    const configCol = app.findCollectionByNameOrId('configuracoes_agencia')

    // Seed agency settings
    try {
      const existingConfig = app.findRecordsByFilter('configuracoes_agencia', '', '', 1, 0)
      if (existingConfig.length === 0) {
        const cfg = new Record(configCol)
        cfg.set('nome_agencia', 'Aura Viagens & Turismo')
        cfg.set('cnpj_cadastur', 'CADASTUR: 26.045.892/0001-30')
        cfg.set('email_contato', 'atendimento@auraviagens.com.br')
        cfg.set('telefone_contato', '(11) 3456-7890')
        cfg.set('whatsapp', '(11) 98765-4321')
        cfg.set('endereco', 'Av. Paulista, 1000, Cj. 142 - Bela Vista, São Paulo - SP')
        cfg.set('site_instagram', '@auraviagens | www.auraviagens.com.br')
        cfg.set('margem_padrao', 15)
        cfg.set('validade_padrao_dias', 7)
        cfg.set(
          'condicoes_padrao',
          '• Valores sujeitos a alteração e disponibilidade sem aviso prévio até a confirmação da reserva.\n• Tarifas aéreas e de hospedagem não reembolsáveis conforme regras de cada fornecedor.\n• Documentação pessoal, passaportes com validade mínima de 6 meses e vistos são de responsabilidade do passageiro.',
        )
        cfg.set(
          'formas_pagamento_padrao',
          '• Entrada de 20% no PIX ou transferência + saldo em até 10x sem juros no cartão de crédito.\n• Desconto especial de 5% para pagamento à vista via PIX.',
        )
        cfg.set(
          'mensagem_agradecimento',
          'Agradecemos a oportunidade de planejar a sua viagem dos sonhos. Estamos à disposição para qualquer ajuste!',
        )
        app.save(cfg)
      }
    } catch (e) {
      console.log('Config seed error:', e)
    }

    // Seed sample quotes
    const sampleQuotes = [
      {
        codigo: 'COT-2025-001',
        cliente_nome: 'Mariana Albuquerque',
        cliente_email: 'mariana.albuquerque@email.com',
        cliente_telefone: '(11) 99887-6543',
        cliente_cpf_passaporte: '345.***.***-00',
        destino: 'Paris & Riviera Francesa, França',
        data_ida: '2025-09-12',
        data_volta: '2025-09-22',
        num_passageiros: 2,
        num_criancas: 0,
        status: 'enviada',
        servicos: [
          {
            id: 'srv-1',
            categoria: 'passagem_aerea',
            nome: 'Passagem Aérea GRU -> CDG / NCE -> GRU (Air France)',
            descricao:
              'Classe Econômica Premium, inclui 2 malas despachadas de 23kg por passageiro e marcação de assentos.',
            fornecedor: 'Air France',
            quantidade: 2,
            valor_unitario: 5400,
            valor_custo_total: 10800,
            observacoes: 'Voos noturnos diretos ida e volta.',
          },
          {
            id: 'srv-2',
            categoria: 'hospedagem',
            nome: 'Hotel Pullman Paris Tour Eiffel (6 noites)',
            descricao: 'Quarto Deluxe com vista para Torre Eiffel, café da manhã incluso.',
            fornecedor: 'Accor',
            quantidade: 1,
            valor_unitario: 8900,
            valor_custo_total: 8900,
            observacoes: 'Check-in 12/09 às 15h, Check-out 18/09 às 11h.',
          },
          {
            id: 'srv-3',
            categoria: 'hospedagem',
            nome: 'Hotel Le Negresco Nice (4 noites)',
            descricao: 'Quarto Superior Sea View, inclui café da manhã buffet.',
            fornecedor: 'The Leading Hotels',
            quantidade: 1,
            valor_unitario: 6200,
            valor_custo_total: 6200,
            observacoes: 'Em frente à Promenade des Anglais.',
          },
          {
            id: 'srv-4',
            categoria: 'traslado',
            nome: 'Transfer Privativo Aeroporto CDG -> Hotel Paris',
            descricao: 'Veículo Executivo Mercedes Classe E com motorista bilíngue.',
            fornecedor: 'Paris Shuttle VIP',
            quantidade: 1,
            valor_unitario: 650,
            valor_custo_total: 650,
            observacoes: 'Recepção com placa nominal no desembarque.',
          },
          {
            id: 'srv-5',
            categoria: 'passeio',
            nome: 'Passeio Privativo Palácio de Versalhes + Museu do Louvre com Guia',
            descricao: 'Entrada sem filas, guia oficial em português e transporte privativo.',
            fornecedor: 'France Exclusiva',
            quantidade: 2,
            valor_unitario: 950,
            valor_custo_total: 1900,
            observacoes: 'Dia inteiro com parada para almoço típico.',
          },
          {
            id: 'srv-6',
            categoria: 'seguro_viagem',
            nome: 'Seguro Viagem Internacional GTA Cobertura EUR 60.000',
            descricao: 'Cobertura médica hospitalar, extravio de bagagem e cancelamento de viagem.',
            fornecedor: 'GTA Assist',
            quantidade: 2,
            valor_unitario: 320,
            valor_custo_total: 640,
            observacoes: 'Válido para todo o Tratado de Schengen por 11 dias.',
          },
        ],
        margem_lucro: 18,
        desconto: 500,
        taxas_adicionais: 0,
        moeda: 'BRL',
        cotacao_moeda: 1,
        valor_custo_total: 29090,
        valor_lucro: 5236.2,
        valor_venda_total: 33826.2,
        observacoes:
          "Roteiro personalizado de 10 noites combinando o charme parisiense com as praias e glamour da Côte d'Azur.",
        condicoes_gerais:
          '• Cotação válida por 7 dias.\n• Voo sujeito a variação cambial e disponibilidade no momento da emissão.\n• Taxas de turismo locais nos hotéis não inclusas (aprox. 3 a 5 euros por pessoa/dia pagas no check-out).',
        formas_pagamento:
          '• Entrada de R$ 6.826,20 (PIX) + 10x de R$ 2.700,00 sem juros no cartão Visa/Mastercard.\n• Desconto à vista de 4%: R$ 32.473,15 via PIX.',
        validade_dias: 7,
        data_validade: '2025-04-30',
      },
      {
        codigo: 'COT-2025-002',
        cliente_nome: 'Rafael & Camila Costa',
        cliente_email: 'rafael.costa@techcompany.com',
        cliente_telefone: '(21) 98123-4567',
        cliente_cpf_passaporte: '128.***.***-15',
        destino: 'Santiago & Deserto do Atacama, Chile',
        data_ida: '2025-10-05',
        data_volta: '2025-10-14',
        num_passageiros: 2,
        num_criancas: 0,
        status: 'aprovada',
        servicos: [
          {
            id: 'srv-chile-1',
            categoria: 'passagem_aerea',
            nome: 'Aéreo GIG -> SCL -> CJC (LATAM)',
            descricao: 'Voo com bagagem despachada e conexão rápida em Santiago.',
            fornecedor: 'LATAM Airlines',
            quantidade: 2,
            valor_unitario: 2900,
            valor_custo_total: 5800,
            observacoes: 'Emissão com pontos + pagto taxas.',
          },
          {
            id: 'srv-chile-2',
            categoria: 'hospedagem',
            nome: 'Hotel Cumbres San Pedro de Atacama (5 noites)',
            descricao: 'Regime All-Inclusive de excursões e pensão completa.',
            fornecedor: 'Cumbres Hotels',
            quantidade: 1,
            valor_unitario: 9400,
            valor_custo_total: 9400,
            observacoes: 'Piscina, spa e carta de vinhos chilenos inclusos.',
          },
          {
            id: 'srv-chile-3',
            categoria: 'hospedagem',
            nome: 'Hotel The Singular Santiago (3 noites)',
            descricao: 'Quarto Classic Lastarria com café da manhã incluso.',
            fornecedor: 'The Singular',
            quantidade: 1,
            valor_unitario: 3100,
            valor_custo_total: 3100,
            observacoes: 'Bairro Lastarria com fácil acesso a vinícolas e restaurantes.',
          },
          {
            id: 'srv-chile-4',
            categoria: 'passeio',
            nome: 'Tour Premium Vinícola Vik Chile com Degustação e Almoço Harmonizado',
            descricao: 'Transporte privativo ida e volta desde Santiago e tour arquitetônico.',
            fornecedor: 'Vik Retreats',
            quantidade: 2,
            valor_unitario: 780,
            valor_custo_total: 1560,
            observacoes: 'Dia completo no Vale de Millahue.',
          },
          {
            id: 'srv-chile-5',
            categoria: 'seguro_viagem',
            nome: 'Seguro Viagem América do Sul Assist Card 150k',
            descricao: 'Ampla cobertura esportes de aventura e emergências médicas.',
            fornecedor: 'Assist Card',
            quantidade: 2,
            valor_unitario: 180,
            valor_custo_total: 360,
            observacoes: '10 dias de cobertura integral.',
          },
        ],
        margem_lucro: 15,
        desconto: 0,
        taxas_adicionais: 0,
        moeda: 'BRL',
        cotacao_moeda: 1,
        valor_custo_total: 20220,
        valor_lucro: 3033,
        valor_venda_total: 23253,
        observacoes: 'Viagem de celebração de bodas de casamento.',
        condicoes_gerais:
          '• Excursões no Atacama acompanhadas de guias locais credenciados.\n• Seguro obrigatório para viagens internacionais.',
        formas_pagamento:
          '• 10x sem juros no cartão de R$ 2.325,30 ou à vista com 5% de desconto no PIX.',
        validade_dias: 5,
        data_validade: '2025-05-15',
      },
      {
        codigo: 'COT-2025-003',
        cliente_nome: 'Família Barbosa',
        cliente_email: 'eduardo.barbosa@consultoria.com.br',
        cliente_telefone: '(31) 99112-2334',
        cliente_cpf_passaporte: '054.***.***-77',
        destino: 'Orlando, Flórida (Disney & Universal)',
        data_ida: '2025-11-10',
        data_volta: '2025-11-22',
        num_passageiros: 3,
        num_criancas: 1,
        status: 'rascunho',
        servicos: [
          {
            id: 'srv-orl-1',
            categoria: 'passagem_aerea',
            nome: 'Passagem Aérea CNF -> MCO (Copa Airlines)',
            descricao: '4 passagens (2 adultos + 2 crianças) com bagagem.',
            fornecedor: 'Copa Airlines',
            quantidade: 4,
            valor_unitario: 4200,
            valor_custo_total: 16800,
            observacoes: 'Conexão no Panamá (PTY).',
          },
          {
            id: 'srv-orl-2',
            categoria: 'hospedagem',
            nome: "Disney's Caribbean Beach Resort (12 noites)",
            descricao:
              'Standard Room com acesso ao Disney Skyliner e benefícios de hóspede Disney.',
            fornecedor: 'Walt Disney World',
            quantidade: 1,
            valor_unitario: 14500,
            valor_custo_total: 14500,
            observacoes: 'Entrada antecipada de 30 min em todos os parques.',
          },
          {
            id: 'srv-orl-3',
            categoria: 'passeio',
            nome: 'Ingressos Disney 4 Dias Magia à Sua Maneira + Universal 2 Dias Park-to-Park',
            descricao:
              'Ingressos oficiais para Magic Kingdom, Epcot, Hollywood Studios, Animal Kingdom, Universal Studios e Islands of Adventure.',
            fornecedor: 'Undercover Tourist',
            quantidade: 4,
            valor_unitario: 3800,
            valor_custo_total: 15200,
            observacoes: 'Vouchers digitais nominais vinculados ao My Disney Experience.',
          },
          {
            id: 'srv-orl-4',
            categoria: 'outros',
            nome: 'Locação SUV Minivan Chrysler Pacifica (12 dias)',
            descricao: 'Proteções totais LDW/ALI + GPS + Pedágio SunPass incluso.',
            fornecedor: 'Alamo Rent A Car',
            quantidade: 1,
            valor_unitario: 3900,
            valor_custo_total: 3900,
            observacoes: 'Retirada e devolução no aeroporto MCO.',
          },
          {
            id: 'srv-orl-5',
            categoria: 'seguro_viagem',
            nome: 'Seguro Viagem Família EUA Hero Seguros USD 100.000',
            descricao: 'Cobertura completa para 4 pessoas com telemedicina Albert Einstein.',
            fornecedor: 'Hero Seguros',
            quantidade: 4,
            valor_unitario: 240,
            valor_custo_total: 960,
            observacoes: 'Cobertura Covid e cancelamento incluídos.',
          },
        ],
        margem_lucro: 14,
        desconto: 800,
        taxas_adicionais: 0,
        moeda: 'BRL',
        cotacao_moeda: 1,
        valor_custo_total: 51360,
        valor_lucro: 7190.4,
        valor_venda_total: 57750.4,
        observacoes:
          'Cotação especial de férias em família com 12 noites em resort dentro do complexo Disney.',
        condicoes_gerais:
          '• Passaporte e visto americano B1/B2 válidos são mandatórios.\n• Ingressos não reembolsáveis após emissão.',
        formas_pagamento: '• Entrada de R$ 12.000,00 + saldo em até 10x de R$ 4.575,04 sem juros.',
        validade_dias: 7,
        data_validade: '2025-05-20',
      },
    ]

    for (let i = 0; i < sampleQuotes.length; i++) {
      const q = sampleQuotes[i]
      try {
        const existing = app.findFirstRecordByData('cotacoes', 'codigo', q.codigo)
        if (existing) continue
      } catch (_) {}

      try {
        const rec = new Record(cotacoesCol)
        rec.set('codigo', q.codigo)
        rec.set('cliente_nome', q.cliente_nome)
        rec.set('cliente_email', q.cliente_email)
        rec.set('cliente_telefone', q.cliente_telefone)
        rec.set('cliente_cpf_passaporte', q.cliente_cpf_passaporte)
        rec.set('destino', q.destino)
        rec.set('data_ida', q.data_ida)
        rec.set('data_volta', q.data_volta)
        rec.set('num_passageiros', q.num_passageiros)
        rec.set('num_criancas', q.num_criancas)
        rec.set('status', q.status)
        rec.set('servicos', JSON.stringify(q.servicos))
        rec.set('margem_lucro', q.margem_lucro)
        rec.set('desconto', q.desconto)
        rec.set('taxas_adicionais', q.taxas_adicionais)
        rec.set('moeda', q.moeda)
        rec.set('cotacao_moeda', q.cotacao_moeda)
        rec.set('valor_custo_total', q.valor_custo_total)
        rec.set('valor_lucro', q.valor_lucro)
        rec.set('valor_venda_total', q.valor_venda_total)
        rec.set('observacoes', q.observacoes)
        rec.set('condicoes_gerais', q.condicoes_gerais)
        rec.set('formas_pagamento', q.formas_pagamento)
        rec.set('validade_dias', q.validade_dias)
        rec.set('data_validade', q.data_validade)
        app.save(rec)
      } catch (err) {
        console.log('Error saving sample quote:', err)
      }
    }
  },
  (app) => {
    // rollback
  },
)
