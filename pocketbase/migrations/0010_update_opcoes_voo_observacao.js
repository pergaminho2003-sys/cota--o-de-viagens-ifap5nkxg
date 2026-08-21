migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('opcoes_voo')

      // 1. Adicionar campo observacao se ainda não existir
      if (!col.fields.getByName('observacao')) {
        col.fields.add(
          new TextField({
            name: 'observacao',
            required: false,
          }),
        )
      }

      // 2. Tornar o campo status não obrigatório para permitir migração limpa se existir
      const statusField = col.fields.getByName('status')
      if (statusField) {
        statusField.required = false
      }

      app.save(col)
    } catch (e) {
      console.log('Erro ao atualizar collection opcoes_voo:', e)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('opcoes_voo')
      const observacaoField = col.fields.getByName('observacao')
      if (observacaoField) {
        col.fields.removeByName('observacao')
        app.save(col)
      }
    } catch (_) {}
  },
)
