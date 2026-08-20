migrate(
  (app) => {
    const cotacoesCol = app.findCollectionByNameOrId('cotacoes')

    const opcoesVoo = new Collection({
      name: 'opcoes_voo',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        {
          name: 'cotacao_id',
          type: 'relation',
          required: true,
          collectionId: cotacoesCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'descricao', type: 'text' },
        { name: 'companhia', type: 'text' },
        { name: 'numero_voo', type: 'text' },
        { name: 'data_voo', type: 'text' },
        { name: 'horario_partida', type: 'text' },
        { name: 'horario_chegada', type: 'text' },
        { name: 'origem', type: 'text' },
        { name: 'destino', type: 'text' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Recomendada', 'Alternativa', 'Mais barata'],
          maxSelect: 1,
        },
        { name: 'custo', type: 'number' },
        { name: 'margem_desejada', type: 'number' },
        { name: 'imposto_percentual', type: 'number' },
        { name: 'preco_mercado', type: 'number' },
        {
          name: 'modo_precificacao',
          type: 'select',
          required: true,
          values: ['margem', 'desconto_mercado'],
          maxSelect: 1,
        },
        { name: 'desconto_mercado_percentual', type: 'number' },
        { name: 'ordem', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_opcoes_voo_cotacao_ordem ON opcoes_voo (cotacao_id, ordem)'],
    })

    app.save(opcoesVoo)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('opcoes_voo')
      app.delete(col)
    } catch (_) {}
  },
)
