migrate(
  (app) => {
    const collection = new Collection({
      name: 'configuracoes_agencia',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
      fields: [
        { name: 'nome_agencia', type: 'text', required: true },
        { name: 'cnpj_cadastur', type: 'text', required: false },
        { name: 'email_contato', type: 'text', required: false },
        { name: 'telefone_contato', type: 'text', required: false },
        { name: 'whatsapp', type: 'text', required: false },
        { name: 'endereco', type: 'text', required: false },
        { name: 'site_instagram', type: 'text', required: false },
        { name: 'logo_url', type: 'text', required: false },
        { name: 'logo_base64', type: 'text', required: false },
        { name: 'margem_padrao', type: 'number', required: false, min: 0 },
        { name: 'validade_padrao_dias', type: 'number', required: false, min: 1 },
        { name: 'condicoes_padrao', type: 'text', required: false },
        { name: 'formas_pagamento_padrao', type: 'text', required: false },
        { name: 'mensagem_agradecimento', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('configuracoes_agencia')
      app.delete(collection)
    } catch (_) {}
  },
)
