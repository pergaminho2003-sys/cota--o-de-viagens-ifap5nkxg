migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('cotacoes')

    if (!col.fields.getByName('preco_mercado')) {
      col.fields.add(
        new NumberField({
          name: 'preco_mercado',
          min: 0,
        }),
      )
    }

    if (!col.fields.getByName('margem_minima_aceitavel')) {
      col.fields.add(
        new NumberField({
          name: 'margem_minima_aceitavel',
          min: 0,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('cotacoes')
    col.fields.removeByName('preco_mercado')
    col.fields.removeByName('margem_minima_aceitavel')
    app.save(col)
  },
)
