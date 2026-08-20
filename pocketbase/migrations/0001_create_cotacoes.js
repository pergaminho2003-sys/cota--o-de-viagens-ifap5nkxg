migrate(
  (app) => {
    const collection = new Collection({
      name: 'cotacoes',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'codigo', type: 'text', required: false },
        { name: 'cliente_nome', type: 'text', required: true },
        { name: 'cliente_email', type: 'text', required: false },
        { name: 'cliente_telefone', type: 'text', required: false },
        { name: 'cliente_cpf_passaporte', type: 'text', required: false },
        { name: 'destino', type: 'text', required: true },
        { name: 'data_ida', type: 'text', required: false },
        { name: 'data_volta', type: 'text', required: false },
        { name: 'num_passageiros', type: 'number', required: false, min: 1 },
        { name: 'num_criancas', type: 'number', required: false, min: 0 },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['rascunho', 'enviada', 'aprovada', 'recusada', 'finalizada'],
          maxSelect: 1,
        },
        { name: 'servicos', type: 'json', required: false },
        { name: 'margem_lucro', type: 'number', required: false, min: 0 },
        { name: 'desconto', type: 'number', required: false, min: 0 },
        { name: 'taxas_adicionais', type: 'number', required: false, min: 0 },
        {
          name: 'moeda',
          type: 'select',
          required: false,
          values: ['BRL', 'USD', 'EUR'],
          maxSelect: 1,
        },
        { name: 'cotacao_moeda', type: 'number', required: false, min: 0 },
        { name: 'valor_custo_total', type: 'number', required: false, min: 0 },
        { name: 'valor_lucro', type: 'number', required: false, min: 0 },
        { name: 'valor_venda_total', type: 'number', required: false, min: 0 },
        { name: 'observacoes', type: 'text', required: false },
        { name: 'condicoes_gerais', type: 'text', required: false },
        { name: 'formas_pagamento', type: 'text', required: false },
        { name: 'validade_dias', type: 'number', required: false, min: 1 },
        { name: 'data_validade', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_cotacoes_cliente ON cotacoes (cliente_nome)',
        'CREATE INDEX idx_cotacoes_destino ON cotacoes (destino)',
        'CREATE INDEX idx_cotacoes_status ON cotacoes (status)',
        'CREATE INDEX idx_cotacoes_created ON cotacoes (created DESC)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('cotacoes')
      app.delete(collection)
    } catch (_) {}
  },
)
