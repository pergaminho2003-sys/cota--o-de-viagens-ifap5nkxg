migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('cotacoes')

    if (!col.fields.getByName('modo_precificacao')) {
      col.fields.add(
        new SelectField({
          name: 'modo_precificacao',
          required: false,
          values: ['margem', 'desconto_mercado'],
          maxSelect: 1,
        }),
      )
    }

    if (!col.fields.getByName('desconto_mercado_percentual')) {
      col.fields.add(
        new NumberField({
          name: 'desconto_mercado_percentual',
          min: 0,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('cotacoes')
    col.fields.removeByName('modo_precificacao')
    col.fields.removeByName('desconto_mercado_percentual')
    app.save(col)
  },
)
