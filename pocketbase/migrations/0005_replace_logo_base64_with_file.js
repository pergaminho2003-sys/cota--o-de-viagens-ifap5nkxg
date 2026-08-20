migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('configuracoes_agencia')

    // 1. Remover o campo logo_base64 se existir
    if (col.fields.getByName('logo_base64')) {
      col.fields.removeByName('logo_base64')
    }

    // 2. Adicionar o campo logo como FileField
    if (!col.fields.getByName('logo')) {
      col.fields.add(
        new FileField({
          name: 'logo',
          maxSelect: 1,
          maxSize: 5242880, // 5MB
          mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('configuracoes_agencia')
    if (col.fields.getByName('logo')) {
      col.fields.removeByName('logo')
    }
    if (!col.fields.getByName('logo_base64')) {
      col.fields.add(
        new TextField({
          name: 'logo_base64',
          required: false,
        }),
      )
    }
    app.save(col)
  },
)
