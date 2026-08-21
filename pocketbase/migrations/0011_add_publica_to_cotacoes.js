migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('cotacoes')
    if (!col.fields.getByName('publica')) {
      col.fields.add(
        new BoolField({
          name: 'publica',
          required: false,
        }),
      )
    }
    app.save(col)

    // Define publica = true para todas as cotações existentes
    app
      .db()
      .newQuery('UPDATE cotacoes SET publica = 1 WHERE publica IS NULL OR publica = 0')
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('cotacoes')
    const field = col.fields.getByName('publica')
    if (field) {
      col.fields.removeByName('publica')
      app.save(col)
    }
  },
)
