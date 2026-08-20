import { Cotacao, ConfiguracoesAgencia, CATEGORIAS_SERVICO } from '@/types/cotacao'
import { formatarMoeda, formatarData, calcularDuracaoDias } from './calculos'

export function gerarHTMLDocumentoProposta(
  cotacao: Cotacao,
  agencia: ConfiguracoesAgencia,
): string {
  const duracao = calcularDuracaoDias(cotacao.data_ida, cotacao.data_volta)
  const totalPassageiros = (cotacao.num_passageiros || 1) + (cotacao.num_criancas || 0)
  const valorPorPessoa = (cotacao.valor_venda_total || 0) / (cotacao.num_passageiros || 1)

  const servicosPorCategoria = cotacao.servicos.reduce(
    (acc, item) => {
      if (!acc[item.categoria]) acc[item.categoria] = []
      acc[item.categoria].push(item)
      return acc
    },
    {} as Record<string, typeof cotacao.servicos>,
  )

  const logoHtml =
    agencia.logo_base64 || agencia.logo_url
      ? `<img src="${agencia.logo_base64 || agencia.logo_url}" alt="${agencia.nome_agencia}" style="max-height: 56px; max-width: 180px; object-fit: contain;" />`
      : `<div style="display: inline-flex; align-items: center; gap: 8px; font-weight: 800; font-size: 20px; color: #0f2744; letter-spacing: -0.5px;">
        <span style="background: linear-gradient(135deg, #0f2744, #1e4976); color: #fff; width: 36px; height: 36px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 18px;">✈</span>
        <span>${agencia.nome_agencia || 'AGÊNCIA DE VIAGENS'}</span>
       </div>`

  const servicosRows = cotacao.servicos
    .map((s, idx) => {
      const catObj = CATEGORIAS_SERVICO.find((c) => c.value === s.categoria)
      const catLabel = catObj ? catObj.label : s.categoria
      return `
      <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : 'background-color: #ffffff;'}">
        <td style="padding: 12px 14px; vertical-align: top;">
          <span style="display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 8px; border-radius: 4px; background: #e0f2fe; color: #0369a1; margin-bottom: 4px;">
            ${catLabel}
          </span>
          <div style="font-weight: 600; color: #0f172a; font-size: 13.5px;">${s.nome}</div>
          ${s.descricao ? `<div style="font-size: 12px; color: #475569; margin-top: 3px; line-height: 1.4;">${s.descricao}</div>` : ''}
          ${s.observacoes ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px; font-style: italic;">Obs: ${s.observacoes}</div>` : ''}
        </td>
        <td style="padding: 12px 14px; text-align: center; vertical-align: top; font-size: 13px; color: #334155; font-weight: 600;">
          ${s.quantidade || 1}
        </td>
        <td style="padding: 12px 14px; text-align: right; vertical-align: top; font-size: 13.5px; color: #0f2744; font-weight: 700; white-space: nowrap;">
          ${formatarMoeda(s.valor_custo_total, cotacao.moeda)}
        </td>
      </tr>
    `
    })
    .join('')

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Cotação de Viagem - ${cotacao.codigo || 'Proposta'}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 13px;
      line-height: 1.5;
    }
    .doc-container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
      background: #ffffff;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f2744;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .badge-quote {
      background: #0f2744;
      color: #ffffff;
      padding: 6px 14px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.5px;
      text-align: right;
    }
    .grid-2 {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
    }
    .box-card {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
    }
    .box-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0f2744;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 4px;
    }
    .box-content p {
      margin: 3px 0;
      font-size: 12.5px;
      color: #1e293b;
    }
    .highlight-dest {
      background: linear-gradient(135deg, #0f2744 0%, #1e4976 100%);
      color: #ffffff;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 22px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .table-servicos {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 12.5px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
    }
    .table-servicos th {
      background: #0f2744;
      color: #ffffff;
      padding: 10px 14px;
      font-size: 11.5px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .financial-box {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }
    .total-card {
      width: 320px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 14px 18px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 12.5px;
      padding: 4px 0;
      color: #334155;
    }
    .total-final {
      border-top: 2px solid #0f2744;
      margin-top: 8px;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .total-final-val {
      font-size: 20px;
      font-weight: 800;
      color: #0f2744;
    }
    .terms-section {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 16px;
      font-size: 11.5px;
      color: #334155;
      line-height: 1.5;
    }
    .terms-title {
      font-weight: 700;
      font-size: 11.5px;
      text-transform: uppercase;
      color: #0f2744;
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }
    .footer-note {
      text-align: center;
      font-size: 11px;
      color: #64748b;
      margin-top: 20px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .doc-container {
        padding: 0;
        max-width: 100%;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="doc-container">
    <!-- Header -->
    <div class="header-bar">
      <div>
        ${logoHtml}
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
          ${agencia.cnpj_cadastur ? `${agencia.cnpj_cadastur} • ` : ''}${agencia.email_contato || ''}
        </div>
      </div>
      <div style="text-align: right;">
        <div class="badge-quote">PROPOSTA COMERCIAL</div>
        <div style="font-size: 14px; font-weight: 800; color: #0f2744; margin-top: 4px;">${cotacao.codigo || 'COT-VIAGEM'}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Data: ${formatarData(cotacao.created || new Date().toISOString())}</div>
      </div>
    </div>

    <!-- Destino e Período Destaque -->
    <div class="highlight-dest">
      <div>
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.85; font-weight: 600;">Destino da Viagem</div>
        <div style="font-size: 20px; font-weight: 800; margin-top: 2px;">${cotacao.destino}</div>
        <div style="font-size: 12.5px; opacity: 0.95; margin-top: 4px;">
          📅 ${formatarData(cotacao.data_ida)} até ${formatarData(cotacao.data_volta)} ${duracao ? `(${duracao} dias / ${duracao > 1 ? duracao - 1 : 1} noites)` : ''}
        </div>
      </div>
      <div style="text-align: right; border-left: 1px solid rgba(255,255,255,0.25); padding-left: 18px;">
        <div style="font-size: 11px; text-transform: uppercase; opacity: 0.85;">Passageiros</div>
        <div style="font-size: 18px; font-weight: 700; margin-top: 2px;">
          ${cotacao.num_passageiros} ${cotacao.num_passageiros > 1 ? 'Adultos' : 'Adulto'}
          ${cotacao.num_criancas > 0 ? ` + ${cotacao.num_criancas} Criança(s)` : ''}
        </div>
        <div style="font-size: 11px; opacity: 0.85; margin-top: 2px;">Total: ${totalPassageiros} pessoa(s)</div>
      </div>
    </div>

    <!-- Info do Cliente e da Agência -->
    <div class="grid-2">
      <div class="box-card">
        <div class="box-title">👤 Passageiro Responsável / Contratante</div>
        <div class="box-content">
          <p><strong>Nome:</strong> ${cotacao.cliente_nome}</p>
          ${cotacao.cliente_telefone ? `<p><strong>Telefone / WhatsApp:</strong> ${cotacao.cliente_telefone}</p>` : ''}
          ${cotacao.cliente_email ? `<p><strong>E-mail:</strong> ${cotacao.cliente_email}</p>` : ''}
          ${cotacao.cliente_cpf_passaporte ? `<p><strong>CPF / Passaporte:</strong> ${cotacao.cliente_cpf_passaporte}</p>` : ''}
        </div>
      </div>

      <div class="box-card">
        <div class="box-title">🏢 Especialista em Viagens</div>
        <div class="box-content">
          <p><strong>${agencia.nome_agencia}</strong></p>
          ${agencia.telefone_contato || agencia.whatsapp ? `<p><strong>Contato:</strong> ${agencia.telefone_contato || agencia.whatsapp}</p>` : ''}
          ${agencia.site_instagram ? `<p><strong>Redes:</strong> ${agencia.site_instagram}</p>` : ''}
          ${cotacao.data_validade ? `<p style="color: #c2410c; font-weight: 600;"><strong>Proposta válida até:</strong> ${formatarData(cotacao.data_validade)}</p>` : ''}
        </div>
      </div>
    </div>

    <!-- Tabela de Serviços Inclusos -->
    <div style="margin-bottom: 6px;">
      <h3 style="font-size: 13px; font-weight: 700; text-transform: uppercase; color: #0f2744; margin: 0 0 8px 0; letter-spacing: 0.5px;">
        ✈️ Serviços e Itens Inclusos na Proposta
      </h3>
    </div>

    <table class="table-servicos">
      <thead>
        <tr>
          <th style="text-align: left; width: 68%;">Item / Descrição do Serviço</th>
          <th style="text-align: center; width: 12%;">Qtd</th>
          <th style="text-align: right; width: 20%;">Total Estimado</th>
        </tr>
      </thead>
      <tbody>
        ${servicosRows}
      </tbody>
    </table>

    <!-- Resumo Financeiro -->
    <div class="financial-box">
      <div class="total-card">
        <div class="total-row">
          <span>Soma dos Serviços:</span>
          <span>${formatarMoeda(cotacao.valor_custo_total, cotacao.moeda)}</span>
        </div>
        ${
          cotacao.taxas_adicionais > 0
            ? `
          <div class="total-row">
            <span>Taxas & Encargos:</span>
            <span>+ ${formatarMoeda(cotacao.taxas_adicionais, cotacao.moeda)}</span>
          </div>
        `
            : ''
        }
        ${
          cotacao.desconto > 0
            ? `
          <div class="total-row" style="color: #059669; font-weight: 600;">
            <span>Desconto Especial:</span>
            <span>- ${formatarMoeda(cotacao.desconto, cotacao.moeda)}</span>
          </div>
        `
            : ''
        }
        <div class="total-final">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700;">Investimento Total</div>
            <div style="font-size: 11px; color: #0369a1;">${formatarMoeda(valorPorPessoa, cotacao.moeda)} / adulto</div>
          </div>
          <div class="total-final-val">
            ${formatarMoeda(cotacao.valor_venda_total, cotacao.moeda)}
          </div>
        </div>
      </div>
    </div>

    <!-- Formas de Pagamento & Condições -->
    ${
      cotacao.formas_pagamento || agencia.formas_pagamento_padrao
        ? `
      <div class="terms-section">
        <div class="terms-title">💳 Formas de Pagamento & Condições Comerciais</div>
        <div style="white-space: pre-line;">${cotacao.formas_pagamento || agencia.formas_pagamento_padrao}</div>
      </div>
    `
        : ''
    }

    ${
      cotacao.observacoes
        ? `
      <div class="terms-section" style="background: #eff6ff; border-color: #bfdbfe;">
        <div class="terms-title" style="color: #1d4ed8;">📌 Observações Importantes do Consultor</div>
        <div style="white-space: pre-line;">${cotacao.observacoes}</div>
      </div>
    `
        : ''
    }

    ${
      cotacao.condicoes_gerais || agencia.condicoes_padrao
        ? `
      <div class="terms-section">
        <div class="terms-title">📋 Condições Gerais & Cancelamento</div>
        <div style="white-space: pre-line;">${cotacao.condicoes_gerais || agencia.condicoes_padrao}</div>
      </div>
    `
        : ''
    }

    <!-- Footer -->
    <div class="footer-note">
      <p style="margin: 0 0 4px 0; font-weight: 600; color: #0f2744;">
        ${agencia.mensagem_agradecimento || 'Agradecemos a confiança em nossa agência. Ficamos felizes em fazer parte da sua próxima jornada!'}
      </p>
      <p style="margin: 0; font-size: 10px; color: #94a3b8;">
        ${agencia.nome_agencia} • ${agencia.endereco || ''} • ${agencia.site_instagram || ''}
      </p>
    </div>
  </div>
</body>
</html>
  `
}

export function imprimirOuSalvarPDF(cotacao: Cotacao, agencia: ConfiguracoesAgencia) {
  const html = gerarHTMLDocumentoProposta(cotacao, agencia)
  const janela = window.open('', '_blank', 'width=900,height=1000')
  if (janela) {
    janela.document.open()
    janela.document.write(html)
    janela.document.close()

    janela.onload = () => {
      setTimeout(() => {
        janela.focus()
        janela.print()
      }, 250)
    }
  } else {
    // Fallback: create an iframe
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    if (iframe.contentWindow) {
      iframe.contentWindow.document.open()
      iframe.contentWindow.document.write(html)
      iframe.contentWindow.document.close()
      setTimeout(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)
      }, 500)
    }
  }
}
