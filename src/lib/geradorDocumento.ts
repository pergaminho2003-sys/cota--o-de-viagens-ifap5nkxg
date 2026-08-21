import { Cotacao, ConfiguracoesAgencia, CATEGORIAS_SERVICO, OpcaoVoo } from '@/types/cotacao'
import {
  formatarMoeda,
  formatarData,
  calcularDuracaoDias,
  calcularOpcaoVoo,
  encontrarIndiceOpcaoMaisBarata,
} from './calculos'

export function gerarHTMLDocumentoProposta(
  cotacao: Cotacao,
  agencia: ConfiguracoesAgencia,
): string {
  const duracao = calcularDuracaoDias(cotacao.data_ida, cotacao.data_volta)
  const totalPassageiros = (cotacao.num_passageiros || 1) + (cotacao.num_criancas || 0)
  const numPassageiros = cotacao.num_passageiros || 1

  const margemFallback =
    cotacao.margem_lucro !== undefined && cotacao.margem_lucro !== null
      ? Number(cotacao.margem_lucro)
      : (agencia.margem_padrao ?? 15)

  const opcoesVoo: OpcaoVoo[] =
    cotacao.opcoes_voo && cotacao.opcoes_voo.length > 0
      ? cotacao.opcoes_voo
      : [
          {
            companhia: 'Companhia Aérea',
            descricao: 'Opção Principal de Voo',
            origem: 'São Paulo',
            destino: cotacao.destino || '',
            observacao: '',
            custo: cotacao.valor_custo_total || 0,
            margem_desejada: isNaN(margemFallback) ? 15 : margemFallback,
            imposto_percentual: agencia.imposto_lucro_padrao ?? 6,
            preco_mercado: cotacao.preco_mercado,
            modo_precificacao: cotacao.modo_precificacao || 'margem',
            desconto_mercado_percentual:
              cotacao.desconto_mercado_percentual !== undefined &&
              cotacao.desconto_mercado_percentual !== null
                ? Number(cotacao.desconto_mercado_percentual)
                : 10,
            ordem: 0,
          },
        ]

  const logoHtml = agencia.logo_url
    ? `<img src="${agencia.logo_url}" alt="${agencia.nome_agencia}" style="max-height: 56px; max-width: 180px; object-fit: contain;" />`
    : `<div style="display: inline-flex; align-items: center; gap: 8px; font-weight: 800; font-size: 20px; color: #0f2744; letter-spacing: -0.5px;">
        <span style="background: linear-gradient(135deg, #0f2744, #1e4976); color: #fff; width: 36px; height: 36px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 18px;">✈</span>
        <span>${agencia.nome_agencia || 'AGÊNCIA DE VIAGENS'}</span>
       </div>`

  const indiceMaisBarata = encontrarIndiceOpcaoMaisBarata(opcoesVoo)

  // Cards de Opções de Voo Independentes (NÃO SOMAR VALORES)
  const opcoesVooCards = opcoesVoo
    .map((op, idx) => {
      const calc = calcularOpcaoVoo({
        custo: op.custo,
        margem_desejada: op.margem_desejada,
        imposto_percentual: op.imposto_percentual,
        preco_mercado: op.preco_mercado,
        modo_precificacao: op.modo_precificacao,
        desconto_mercado_percentual: op.desconto_mercado_percentual,
      })

      const valorPorPessoa = calc.precoFinal / numPassageiros
      const isMaisBarata = indiceMaisBarata === idx
      const temObservacao = Boolean(op.observacao && op.observacao.trim())

      // Tags HTML: badge "Mais barata" e/ou texto de observação ao lado
      const tagsHtml = `
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px;">
          <span style="display: inline-block; background: #0f172a; color: #ffffff; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 8px; border-radius: 4px;">
            Opção ${idx + 1}
          </span>
          ${
            isMaisBarata
              ? `<span style="display: inline-block; background: #059669; color: #ffffff; font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 3px 10px; border-radius: 6px;">
                  Mais barata
                </span>`
              : ''
          }
          ${
            temObservacao
              ? `<span style="display: inline-block; background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; font-size: 11px; font-weight: 600; padding: 2px 9px; border-radius: 6px;">
                  ${op.observacao?.trim()}
                </span>`
              : ''
          }
        </div>
      `

      return `
      <div style="background: #ffffff; border: 2px solid ${isMaisBarata ? '#059669' : '#cbd5e1'}; border-radius: 10px; padding: 16px; margin-bottom: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
          <div>
            ${tagsHtml}
            <div style="font-size: 15px; font-weight: 800; color: #0f172a;">
              ${op.descricao || `${op.companhia} • ${op.origem} → ${op.destino}`}
            </div>
            <div style="font-size: 12px; color: #475569; margin-top: 2px;">
              <strong>Companhia:</strong> ${op.companhia || 'Aérea'} ${op.numero_voo ? `(${op.numero_voo})` : ''}
              ${op.data_voo ? ` • <strong>Data:</strong> ${formatarData(op.data_voo)}` : ''}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700;">Preço da Opção</div>
            <div style="font-size: 20px; font-weight: 900; color: #0f2744;">
              ${formatarMoeda(calc.precoFinal, cotacao.moeda)}
            </div>
            <div style="font-size: 11px; color: #0284c7; font-weight: 600;">
              ${formatarMoeda(valorPorPessoa, cotacao.moeda)} / adulto (${numPassageiros}x)
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border-radius: 6px; padding: 10px 12px; font-size: 12px; color: #334155;">
          <div>
            ${op.origem ? `<strong>Origem:</strong> ${op.origem}` : ''}
            ${op.horario_partida ? ` às ${op.horario_partida}` : ''}
            <span style="margin: 0 6px; color: #94a3b8;">➔</span>
            ${op.destino ? `<strong>Destino:</strong> ${op.destino}` : ''}
            ${op.horario_chegada ? ` às ${op.horario_chegada}` : ''}
          </div>
          ${
            calc.temVantagemComercial && op.preco_mercado
              ? `
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px;">
              Economia de ${formatarMoeda(calc.economiaClienteReais, cotacao.moeda)} (${calc.economiaClientePercent.toFixed(0)}% OFF vs balcão)
            </div>
          `
              : ''
          }
        </div>
      </div>
    `
    })
    .join('')

  // Tabela de Serviços Adicionais (se houver)
  const servicosRows = (cotacao.servicos || [])
    .map((s, idx) => {
      const catObj = CATEGORIAS_SERVICO.find((c) => c.value === s.categoria)
      const catLabel = catObj ? catObj.label : s.categoria
      return `
    <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : 'background-color: #ffffff;'}">
      <td style="padding: 10px 14px; vertical-align: top;">
        <span style="display: inline-block; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 8px; border-radius: 4px; background: #e0f2fe; color: #0369a1; margin-bottom: 3px;">
          ${catLabel}
        </span>
        <div style="font-weight: 600; color: #0f172a; font-size: 13px;">${s.nome}</div>
        ${s.descricao ? `<div style="font-size: 11.5px; color: #475569; margin-top: 2px; line-height: 1.4;">${s.descricao}</div>` : ''}
      </td>
      <td style="padding: 10px 14px; text-align: center; vertical-align: top; font-size: 12.5px; color: #334155; font-weight: 600;">
        ${s.quantidade || 1}
      </td>
      <td style="padding: 10px 14px; text-align: right; vertical-align: top; font-size: 11.5px; white-space: nowrap;">
        <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; background: #ecfdf5; color: #047857; font-weight: 700; border: 1px solid #a7f3d0;">
          Incluso
        </span>
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
      font-size: 12.5px;
      line-height: 1.5;
    }
    .doc-container {
      width: 100%;
      max-width: 820px;
      margin: 0 auto;
      padding: 20px;
      background: #ffffff;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f2744;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .badge-quote {
      background: #0f2744;
      color: #ffffff;
      padding: 6px 14px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 11.5px;
      letter-spacing: 0.5px;
      text-align: right;
    }
    .grid-2 {
      display: flex;
      gap: 14px;
      margin-bottom: 18px;
    }
    .box-card {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
    }
    .box-title {
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0f2744;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 4px;
    }
    .box-content p {
      margin: 2px 0;
      font-size: 12px;
      color: #1e293b;
    }
    .highlight-dest {
      background: linear-gradient(135deg, #0f2744 0%, #1e4976 100%);
      color: #ffffff;
      border-radius: 8px;
      padding: 16px 20px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-title {
      font-size: 12.5px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f2744;
      margin: 0 0 10px 0;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .table-servicos {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
      font-size: 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
    }
    .table-servicos th {
      background: #0f2744;
      color: #ffffff;
      padding: 9px 12px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .terms-section {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 14px;
      font-size: 11.5px;
      color: #334155;
      line-height: 1.5;
    }
    .terms-title {
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      color: #0f2744;
      margin-bottom: 5px;
      letter-spacing: 0.5px;
    }
    .footer-note {
      text-align: center;
      font-size: 10.5px;
      color: #64748b;
      margin-top: 16px;
      padding-top: 10px;
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
        <div style="font-size: 10.5px; color: #64748b; margin-top: 4px;">
          ${agencia.cnpj_cadastur ? `${agencia.cnpj_cadastur} • ` : ''}${agencia.email_contato || ''}
        </div>
      </div>
      <div style="text-align: right;">
        <div class="badge-quote">PROPOSTA COMERCIAL</div>
        <div style="font-size: 14px; font-weight: 800; color: #0f2744; margin-top: 4px;">${cotacao.codigo || 'COT-VIAGEM'}</div>
        <div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">Data: ${formatarData(cotacao.created || new Date().toISOString())}</div>
      </div>
    </div>

    <!-- Destino e Período Destaque -->
    <div class="highlight-dest">
      <div>
        <div style="font-size: 10.5px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.85; font-weight: 600;">Destino da Viagem</div>
        <div style="font-size: 20px; font-weight: 800; margin-top: 2px;">${cotacao.destino}</div>
        <div style="font-size: 12px; opacity: 0.95; margin-top: 4px;">
          📅 ${formatarData(cotacao.data_ida)} até ${formatarData(cotacao.data_volta)} ${duracao ? `(${duracao} dias / ${duracao > 1 ? duracao - 1 : 1} noites)` : ''}
        </div>
      </div>
      <div style="text-align: right; border-left: 1px solid rgba(255,255,255,0.25); padding-left: 18px;">
        <div style="font-size: 10.5px; text-transform: uppercase; opacity: 0.85;">Passageiros</div>
        <div style="font-size: 17px; font-weight: 700; margin-top: 2px;">
          ${cotacao.num_passageiros} ${cotacao.num_passageiros > 1 ? 'Adultos' : 'Adulto'}
          ${cotacao.num_criancas > 0 ? ` + ${cotacao.num_criancas} Criança(s)` : ''}
        </div>
        <div style="font-size: 10.5px; opacity: 0.85; margin-top: 2px;">Total: ${totalPassageiros} viajante(s)</div>
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
          <p><strong>${agencia.nome_agencia || 'Agência de Viagens'}</strong></p>
          ${agencia.telefone_contato || agencia.whatsapp ? `<p><strong>Contato:</strong> ${agencia.telefone_contato || agencia.whatsapp}</p>` : ''}
          ${agencia.site_instagram ? `<p><strong>Redes:</strong> ${agencia.site_instagram}</p>` : ''}
        </div>
      </div>
    </div>

    <!-- SEÇÃO: OPÇÕES DE VOO INDEPENDENTES (AJUSTE 1) -->
    <div style="margin-bottom: 18px;">
      <div class="section-title">
        ✈️ Opções de Voo Disponíveis (${opcoesVoo.length} ${opcoesVoo.length === 1 ? 'opção' : 'opções'})
      </div>
      <p style="font-size: 11.5px; color: #64748b; margin: -6px 0 12px 0;">
        Escolha a opção de voo que melhor atende à sua preferência de horários e orçamento:
      </p>

      ${opcoesVooCards}
    </div>

    <!-- Serviços Terrestres Inclusos (Se houver) -->
    ${
      (cotacao.servicos || []).length > 0
        ? `
      <div style="margin-bottom: 18px;">
        <div class="section-title">
          🏨 Serviços Terrestres & Outros Inclusos no Pacote
        </div>
        <table class="table-servicos">
          <thead>
            <tr>
              <th style="text-align: left; width: 70%;">Item / Descrição do Serviço</th>
              <th style="text-align: center; width: 14%;">Qtd</th>
              <th style="text-align: right; width: 16%;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${servicosRows}
          </tbody>
        </table>
      </div>
    `
        : ''
    }

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
