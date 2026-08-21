migrate(
  (app) => {
    // Se existir registro em configuracoes_agencia com whatsapp residual '(11) 98765-4321', limpar ou sincronizar
    try {
      const list = app.findRecordsByFilter('configuracoes_agencia', '', '-created', 10, 0)
      for (const item of list) {
        if (item.getString('whatsapp') === '(11) 98765-4321') {
          item.set('whatsapp', '')
          app.save(item)
        }
      }
    } catch (_) {}
  },
  (app) => {},
)
