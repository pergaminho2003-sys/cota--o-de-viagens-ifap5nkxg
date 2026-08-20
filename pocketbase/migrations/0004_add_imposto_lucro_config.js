migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('configuracoes_agencia')
    if (!col.fields.getByName('imposto_lucro_padrao')) {
      col.fields.add(
        new NumberField({
          name: 'imposto_lucro_padrao',
          min: 0,
        }),
      )
    }
    app.save(col)

    // Atualizar registros existentes para ter valor padrão 6 se nulo/vazio
    app
      .db()
      .newQuery(
        'UPDATE configuracoes_agencia SET imposto_lucro_padrao = 6 WHERE imposto_lucro_padrao IS NULL OR imposto_lucro_padrao = 0',
      )
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('configuracoes_agencia')
    col.fields.removeByName('imposto_lucro_padrao')
    app.save(col)
  },
)
