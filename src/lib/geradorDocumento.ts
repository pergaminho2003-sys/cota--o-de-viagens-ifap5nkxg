import { Cotacao, ConfiguracoesAgencia, CATEGORIAS_SERVICO, OpcaoVoo } from '@/types/cotacao'
import {
  formatarMoeda,
  formatarData,
  calcularDuracaoDias,
  calcularOpcaoVoo,
  encontrarIndiceOpcaoMaisBarata,
} from './calculos'

function sanitizarNumeroWhatsApp(tel?: string): string {
  if (!tel) return ''
  const apenasDigitos = tel.replace(/\D/g, '')
  if (!apenasDigitos) return ''
  // Se não tiver DDI (ex: 11999998888 com 10 ou 11 dígitos), assume Brasil (+55)
  if (apenasDigitos.length === 10 || apenasDigitos.length === 11) {
    return `55${apenasDigitos}`
  }
  return apenasDigitos
}

function escapeHtml(str?: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Normaliza a lista de opções de voo da cotação.
 */
export function extrairOpcoesVoo(cotacao: Cotacao, agencia: ConfiguracoesAgencia): OpcaoVoo[] {
  const margemFallback =
    cotacao.margem_lucro !== undefined && cotacao.margem_lucro !== null
      ? Number(cotacao.margem_lucro)
      : (agencia.margem_padrao ?? 15)

  if (cotacao.opcoes_voo && cotacao.opcoes_voo.length > 0) {
    return cotacao.opcoes_voo
  }

  return [
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
}

/**
 * Gera o documento para impressão / PDF (formato estático tradicional de impressão).
 */
export function gerarHTMLDocumentoProposta(
  cotacao: Cotacao,
  agencia: ConfiguracoesAgencia,
): string {
  const duracao = calcularDuracaoDias(cotacao.data_ida, cotacao.data_volta)
  const totalPassageiros = (cotacao.num_passageiros || 1) + (cotacao.num_criancas || 0)
  const numPassageiros = cotacao.num_passageiros || 1

  const opcoesVoo = extrairOpcoesVoo(cotacao, agencia)

  const logoHtml = agencia.logo_url
    ? `<img src="${escapeHtml(agencia.logo_url)}" alt="${escapeHtml(agencia.nome_agencia)}" style="max-height: 56px; max-width: 180px; object-fit: contain;" />`
    : `<div style="display: inline-flex; align-items: center; gap: 8px; font-weight: 800; font-size: 20px; color: #0f2744; letter-spacing: -0.5px;">
        <span style="background: linear-gradient(135deg, #0f2744, #1e4976); color: #fff; width: 36px; height: 36px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 18px;">✈</span>
        <span>${escapeHtml(agencia.nome_agencia || 'AGÊNCIA DE VIAGENS')}</span>
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
                  ${escapeHtml(op.observacao?.trim())}
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
              ${escapeHtml(op.descricao || `${op.companhia} • ${op.origem} → ${op.destino}`)}
            </div>
            <div style="font-size: 12px; color: #475569; margin-top: 2px;">
              <strong>Companhia:</strong> ${escapeHtml(op.companhia || 'Aérea')} ${op.numero_voo ? `(${escapeHtml(op.numero_voo)})` : ''}
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
            ${op.origem ? `<strong>Origem:</strong> ${escapeHtml(op.origem)}` : ''}
            ${op.horario_partida ? ` às ${escapeHtml(op.horario_partida)}` : ''}
            <span style="margin: 0 6px; color: #94a3b8;">➔</span>
            ${op.destino ? `<strong>Destino:</strong> ${escapeHtml(op.destino)}` : ''}
            ${op.horario_chegada ? ` às ${escapeHtml(op.horario_chegada)}` : ''}
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
          ${escapeHtml(catLabel)}
        </span>
        <div style="font-weight: 600; color: #0f172a; font-size: 13px;">${escapeHtml(s.nome)}</div>
        ${s.descricao ? `<div style="font-size: 11.5px; color: #475569; margin-top: 2px; line-height: 1.4;">${escapeHtml(s.descricao)}</div>` : ''}
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

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cotação de Viagem - ${escapeHtml(cotacao.codigo || 'Proposta')}</title>
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
          ${agencia.cnpj_cadastur ? `${escapeHtml(agencia.cnpj_cadastur)} • ` : ''}${escapeHtml(agencia.email_contato || '')}
        </div>
      </div>
      <div style="text-align: right;">
        <div class="badge-quote">PROPOSTA COMERCIAL</div>
        <div style="font-size: 14px; font-weight: 800; color: #0f2744; margin-top: 4px;">${escapeHtml(cotacao.codigo || 'COT-VIAGEM')}</div>
        <div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">Data: ${formatarData(cotacao.created || new Date().toISOString())}</div>
      </div>
    </div>

    <!-- Destino e Período Destaque -->
    <div class="highlight-dest">
      <div>
        <div style="font-size: 10.5px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.85; font-weight: 600;">Destino da Viagem</div>
        <div style="font-size: 20px; font-weight: 800; margin-top: 2px;">${escapeHtml(cotacao.destino)}</div>
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
          <p><strong>Nome:</strong> ${escapeHtml(cotacao.cliente_nome)}</p>
          ${cotacao.cliente_telefone ? `<p><strong>Telefone / WhatsApp:</strong> ${escapeHtml(cotacao.cliente_telefone)}</p>` : ''}
          ${cotacao.cliente_email ? `<p><strong>E-mail:</strong> ${escapeHtml(cotacao.cliente_email)}</p>` : ''}
          ${cotacao.cliente_cpf_passaporte ? `<p><strong>CPF / Passaporte:</strong> ${escapeHtml(cotacao.cliente_cpf_passaporte)}</p>` : ''}
        </div>
      </div>

      <div class="box-card">
        <div class="box-title">🏢 Especialista em Viagens</div>
        <div class="box-content">
          <p><strong>${escapeHtml(agencia.nome_agencia || 'Agência de Viagens')}</strong></p>
          ${agencia.telefone_contato || agencia.whatsapp ? `<p><strong>Contato:</strong> ${escapeHtml(agencia.telefone_contato || agencia.whatsapp)}</p>` : ''}
          ${agencia.site_instagram ? `<p><strong>Redes:</strong> ${escapeHtml(agencia.site_instagram)}</p>` : ''}
        </div>
      </div>
    </div>

    <!-- SEÇÃO: OPÇÕES DE VOO INDEPENDENTES -->
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
        <div style="white-space: pre-line;">${escapeHtml(cotacao.formas_pagamento || agencia.formas_pagamento_padrao)}</div>
      </div>
    `
        : ''
    }

    ${
      cotacao.observacoes
        ? `
      <div class="terms-section" style="background: #eff6ff; border-color: #bfdbfe;">
        <div class="terms-title" style="color: #1d4ed8;">📌 Observações Importantes do Consultor</div>
        <div style="white-space: pre-line;">${escapeHtml(cotacao.observacoes)}</div>
      </div>
    `
        : ''
    }

    ${
      cotacao.condicoes_gerais || agencia.condicoes_padrao
        ? `
      <div class="terms-section">
        <div class="terms-title">📋 Condições Gerais & Cancelamento</div>
        <div style="white-space: pre-line;">${escapeHtml(cotacao.condicoes_gerais || agencia.condicoes_padrao)}</div>
      </div>
    `
        : ''
    }

    <!-- Footer -->
    <div class="footer-note">
      <p style="margin: 0 0 4px 0; font-weight: 600; color: #0f2744;">
        ${escapeHtml(agencia.mensagem_agradecimento || 'Agradecemos a confiança em nossa agência. Ficamos felizes em fazer parte da sua próxima jornada!')}
      </p>
      <p style="margin: 0; font-size: 10px; color: #94a3b8;">
        ${escapeHtml(agencia.nome_agencia)} • ${escapeHtml(agencia.endereco || '')} • ${escapeHtml(agencia.site_instagram || '')}
      </p>
    </div>
  </div>
</body>
</html>`
}

/**
 * NOVO RECURSO: Gera a proposta em formato HTML Autocontido, Moderno,
 * Responsivo (mobile + desktop) e Interativo (com accordions expansíveis
 * e botões de WhatsApp para confirmação direta da opção escolhida).
 *
 * SIGILO: NÃO inclui nenhum cálculo interno de margem, lucro ou painel interno.
 */
export function gerarHTMLPropostaCliente(cotacao: Cotacao, agencia: ConfiguracoesAgencia): string {
  const duracao = calcularDuracaoDias(cotacao.data_ida, cotacao.data_volta)
  const totalPassageiros = (cotacao.num_passageiros || 1) + (cotacao.num_criancas || 0)
  const numPassageiros = cotacao.num_passageiros || 1

  const opcoesVoo = extrairOpcoesVoo(cotacao, agencia)
  const indiceMaisBarata = encontrarIndiceOpcaoMaisBarata(opcoesVoo)
  const temMultiplasOpcoes = opcoesVoo.length > 1

  const whatsappAgencia =
    sanitizarNumeroWhatsApp(agencia.whatsapp) || sanitizarNumeroWhatsApp(agencia.telefone_contato)

  const logoHtml = agencia.logo_url
    ? `<img src="${escapeHtml(agencia.logo_url)}" alt="${escapeHtml(agencia.nome_agencia)}" class="header-logo-img" />`
    : `<div class="header-logo-fallback">
        <div class="logo-icon-box">✈</div>
        <span class="logo-title">${escapeHtml(agencia.nome_agencia || 'Agência de Viagens')}</span>
       </div>`

  // Cards de Opções de Voo
  const cardsVooHtml = opcoesVoo
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

      const tituloOpcao =
        op.descricao ||
        `${op.companhia || 'Voo'} ${op.origem ? `(${op.origem})` : ''} → ${op.destino ? `(${op.destino})` : ''}`

      // Monta mensagem WhatsApp pré-preenchida
      const msgTexto = `Olá! Recebi a proposta #${cotacao.codigo} para ${cotacao.destino} e tenho interesse na *Opção ${idx + 1}* (${tituloOpcao}) por *${formatarMoeda(calc.precoFinal, cotacao.moeda)}*. Como podemos prosseguir com a emissão?`
      const msgEncoded = encodeURIComponent(msgTexto)
      const linkWhatsApp = whatsappAgencia
        ? `https://wa.me/${whatsappAgencia}?text=${msgEncoded}`
        : `https://api.whatsapp.com/send?text=${msgEncoded}`

      // Se houver múltiplas opções, apenas a primeira (ou a mais barata) começa aberta por padrão
      const isCardAbertoInicial = temMultiplasOpcoes ? isMaisBarata || idx === 0 : true

      return `
      <div class="card-voo ${isMaisBarata ? 'card-voo-destaque' : ''} ${isCardAbertoInicial ? 'is-open' : ''}" id="card-voo-${idx}">
        <!-- Cabeçalho do Card (Clicável quando houver múltiplas opções) -->
        <div class="card-voo-header ${temMultiplasOpcoes ? 'card-voo-clickable' : ''}" ${temMultiplasOpcoes ? `onclick="toggleCardVoo(${idx})"` : ''}>
          <div class="card-voo-title-group">
            <div class="card-tags-row">
              <span class="tag-opcao">Opção ${idx + 1}</span>
              ${
                isMaisBarata
                  ? `<span class="tag-mais-barata">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                      Mais barata
                    </span>`
                  : ''
              }
              ${
                temObservacao
                  ? `<span class="tag-observacao">${escapeHtml(op.observacao?.trim())}</span>`
                  : ''
              }
            </div>

            <h3 class="card-voo-title">${escapeHtml(tituloOpcao)}</h3>

            <div class="card-voo-subinfo">
              <span class="subinfo-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"></path></svg>
                ${escapeHtml(op.companhia || 'Companhia Aérea')} ${op.numero_voo ? `(${escapeHtml(op.numero_voo)})` : ''}
              </span>
              ${
                op.data_voo
                  ? `<span class="subinfo-item">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      ${formatarData(op.data_voo)}
                    </span>`
                  : ''
              }
            </div>
          </div>

          <div class="card-voo-price-side">
            <span class="price-label">Preço Final da Opção</span>
            <span class="price-value">${formatarMoeda(calc.precoFinal, cotacao.moeda)}</span>
            <span class="price-per-person">${formatarMoeda(valorPorPessoa, cotacao.moeda)} / adulto (${numPassageiros}x)</span>

            ${
              temMultiplasOpcoes
                ? `<div class="card-toggle-indicator">
                    <span class="toggle-text">${isCardAbertoInicial ? 'Ocultar detalhes' : 'Ver detalhes'}</span>
                    <svg class="toggle-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                   </div>`
                : ''
            }
          </div>
        </div>

        <!-- Conteúdo do Card (Accordion/Expansível) -->
        <div class="card-voo-body">
          <!-- Rota e Horários -->
          <div class="card-rota-box">
            <div class="rota-itinerario">
              <div class="rota-ponto">
                <span class="ponto-label">Origem</span>
                <span class="ponto-nome">${escapeHtml(op.origem || 'Origem')}</span>
                ${op.horario_partida ? `<span class="ponto-horario">⏰ ${escapeHtml(op.horario_partida)}</span>` : ''}
              </div>

              <div class="rota-divisor">
                <span class="rota-linha"></span>
                <span class="rota-icone">➔</span>
                <span class="rota-linha"></span>
              </div>

              <div class="rota-ponto">
                <span class="ponto-label">Destino</span>
                <span class="ponto-nome">${escapeHtml(op.destino || 'Destino')}</span>
                ${op.horario_chegada ? `<span class="ponto-horario">🏁 ${escapeHtml(op.horario_chegada)}</span>` : ''}
              </div>
            </div>

            ${
              calc.temVantagemComercial && op.preco_mercado
                ? `
              <div class="badge-economia">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                <span><strong>Economia de ${formatarMoeda(calc.economiaClienteReais, cotacao.moeda)}</strong> (${calc.economiaClientePercent.toFixed(0)}% OFF em relação ao preço de balcão)</span>
              </div>
            `
                : ''
            }
          </div>

          <!-- Botão de Ação WhatsApp Direto Desta Opção -->
          <div class="card-action-bar">
            <div class="action-summary-text">
              Gostou da <strong>Opção ${idx + 1}</strong>? Garanta as tarifas desta opção falando direto com o consultor:
            </div>
            <a href="${linkWhatsApp}" target="_blank" rel="noopener noreferrer" class="btn-whatsapp-opcao">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>Confirmar esta opção no WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    `
    })
    .join('')

  // Tabela de Serviços Adicionais
  const servicosRows = (cotacao.servicos || [])
    .map((s, idx) => {
      const catObj = CATEGORIAS_SERVICO.find((c) => c.value === s.categoria)
      const catLabel = catObj ? catObj.label : s.categoria
      return `
    <tr class="${idx % 2 === 1 ? 'row-alt' : ''}">
      <td class="servico-td-nome">
        <span class="badge-cat-servico">${escapeHtml(catLabel)}</span>
        <div class="servico-nome">${escapeHtml(s.nome)}</div>
        ${s.descricao ? `<div class="servico-desc">${escapeHtml(s.descricao)}</div>` : ''}
      </td>
      <td class="servico-td-qtd">${s.quantidade || 1}</td>
      <td class="servico-td-status">
        <span class="badge-incluso">Incluso</span>
      </td>
    </tr>
  `
    })
    .join('')

  // Mensagem WhatsApp Geral (topo ou rodapé)
  const msgGeral = `Olá! Gostaria de conversar sobre a proposta de viagem #${cotacao.codigo} para ${cotacao.destino}.`
  const linkWhatsAppGeral = whatsappAgencia
    ? `https://wa.me/${whatsappAgencia}?text=${encodeURIComponent(msgGeral)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(msgGeral)}`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  <title>Proposta de Viagem - ${escapeHtml(cotacao.destino)} (${escapeHtml(cotacao.codigo || 'Cotação')})</title>
  <style>
    /* RESET & ESTILOS BASE AUTOCONTIDOS */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }
    html {
      font-size: 16px;
      scroll-behavior: smooth;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #f1f5f9;
      line-height: 1.5;
      padding: 12px;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .wrapper {
      max-width: 860px;
      margin: 0 auto 32px auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04);
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }

    /* HEADER */
    .header-bar {
      padding: 24px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      border-bottom: 2px solid #0f2744;
      background: #ffffff;
      flex-wrap: wrap;
    }
    .header-logo-img {
      max-height: 54px;
      max-width: 220px;
      object-fit: contain;
    }
    .header-logo-fallback {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-icon-box {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #0f2744, #1e4976);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 800;
      box-shadow: 0 2px 8px rgba(15, 39, 68, 0.25);
    }
    .logo-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f2744;
      letter-spacing: -0.5px;
    }
    .header-agency-sub {
      font-size: 11.5px;
      color: #64748b;
      margin-top: 4px;
    }
    .header-meta {
      text-align: right;
    }
    .badge-quote {
      display: inline-block;
      background: #0f2744;
      color: #ffffff;
      padding: 5px 12px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 11px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
    .quote-code {
      font-size: 15px;
      font-weight: 800;
      color: #0f2744;
      margin-top: 3px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .quote-date {
      font-size: 11.5px;
      color: #64748b;
    }

    /* CONTEÚDO PRINCIPAL */
    .content-body {
      padding: 24px 28px;
    }

    /* HERO DESTINO */
    .hero-dest {
      background: linear-gradient(135deg, #0b1e33 0%, #0f2744 45%, #1e4976 100%);
      color: #ffffff;
      border-radius: 14px;
      padding: 24px 28px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      box-shadow: 0 4px 14px rgba(15, 39, 68, 0.15);
      flex-wrap: wrap;
    }
    .hero-dest-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #7dd3fc;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .hero-dest-title {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
      margin-top: 4px;
      line-height: 1.2;
    }
    .hero-dest-dates {
      font-size: 13.5px;
      color: #f0f9ff;
      margin-top: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
    }
    .hero-passengers-box {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 12px 18px;
      text-align: right;
      min-width: 170px;
    }
    .passengers-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #bae6fd;
      font-weight: 700;
    }
    .passengers-count {
      font-size: 18px;
      font-weight: 800;
      color: #ffffff;
      margin-top: 2px;
    }
    .passengers-sub {
      font-size: 11px;
      color: #e0f2fe;
      margin-top: 2px;
    }

    /* GRID INFO: CLIENTE & CONSULTORIA */
    .grid-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
    }
    .info-card-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0f2744;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px dashed #cbd5e1;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .info-card-body p {
      font-size: 12.5px;
      color: #334155;
      margin-bottom: 4px;
    }
    .info-card-body strong {
      color: #0f172a;
    }

    /* SEÇÃO OPÇÕES DE VOO */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 8px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .section-title {
      font-size: 15px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #0f2744;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-subtitle {
      font-size: 12.5px;
      color: #64748b;
      margin-bottom: 16px;
    }

    /* CARDS DE VOO MODERNOS & INTERATIVOS */
    .card-voo {
      background: #ffffff;
      border: 2px solid #cbd5e1;
      border-radius: 14px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      transition: all 0.25s ease;
      overflow: hidden;
    }
    .card-voo:hover {
      border-color: #94a3b8;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
    }
    .card-voo-destaque {
      border-color: #059669 !important;
      background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 120px);
      box-shadow: 0 4px 16px rgba(5, 150, 105, 0.12) !important;
    }
    .card-voo-header {
      padding: 18px 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      user-select: none;
    }
    .card-voo-clickable {
      cursor: pointer;
    }
    .card-voo-clickable:hover {
      background-color: rgba(241, 245, 249, 0.6);
    }
    .card-voo-destaque.card-voo-clickable:hover {
      background-color: rgba(236, 253, 245, 0.8);
    }

    .card-voo-title-group {
      flex: 1;
      min-width: 0;
    }
    .card-tags-row {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 6px;
    }
    .tag-opcao {
      background: #0f172a;
      color: #ffffff;
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 3px 8px;
      border-radius: 5px;
    }
    .tag-mais-barata {
      background: #059669;
      color: #ffffff;
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 3px 10px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      box-shadow: 0 1px 4px rgba(5, 150, 105, 0.3);
    }
    .tag-observacao {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 6px;
    }
    .card-voo-title {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
      line-height: 1.3;
    }
    .card-voo-subinfo {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 6px;
      font-size: 12px;
      color: #475569;
    }
    .subinfo-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .card-voo-price-side {
      text-align: right;
      flex-shrink: 0;
    }
    .price-label {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 800;
      letter-spacing: 0.6px;
      color: #64748b;
      display: block;
    }
    .price-value {
      font-size: 22px;
      font-weight: 900;
      color: #0f2744;
      display: block;
      line-height: 1.1;
      margin-top: 2px;
      letter-spacing: -0.5px;
    }
    .price-per-person {
      font-size: 11.5px;
      color: #0284c7;
      font-weight: 700;
      display: block;
      margin-top: 2px;
    }
    .card-toggle-indicator {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 6px;
      font-size: 11.5px;
      font-weight: 700;
      color: #0f2744;
      background: #f1f5f9;
      padding: 4px 10px;
      border-radius: 6px;
      transition: all 0.2s;
    }
    .card-voo.is-open .toggle-arrow {
      transform: rotate(180deg);
    }
    .toggle-arrow {
      transition: transform 0.2s ease;
    }

    /* CORPO DO CARD (EXPANSÍVEL) */
    .card-voo-body {
      display: none;
      padding: 0 20px 20px 20px;
      border-top: 1px solid #f1f5f9;
      animation: fadeIn 0.25s ease-out;
    }
    .card-voo.is-open .card-voo-body {
      display: block;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .card-rota-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
      margin-top: 14px;
    }
    .rota-itinerario {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .rota-ponto {
      display: flex;
      flex-direction: column;
    }
    .ponto-label {
      font-size: 10.5px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
    }
    .ponto-nome {
      font-size: 13.5px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
    }
    .ponto-horario {
      font-size: 12px;
      font-weight: 700;
      color: #0284c7;
      margin-top: 2px;
    }
    .rota-divisor {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      justify-content: center;
      min-width: 60px;
    }
    .rota-linha {
      flex: 1;
      height: 1px;
      background: #cbd5e1;
    }
    .rota-icone {
      color: #0284c7;
      font-size: 14px;
      font-weight: 800;
    }
    .badge-economia {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 12px;
      margin-top: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* BOTÃO DE CONFIRMAR OPÇÃO (WHATSAPP) */
    .card-action-bar {
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px dashed #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .action-summary-text {
      font-size: 12px;
      color: #475569;
    }
    .btn-whatsapp-opcao {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #25D366;
      color: #ffffff;
      text-decoration: none;
      font-weight: 800;
      font-size: 13.5px;
      padding: 12px 18px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(37, 211, 102, 0.3);
      transition: all 0.2s ease;
      text-align: center;
    }
    .btn-whatsapp-opcao:hover, .btn-whatsapp-opcao:active {
      background: #20BA5A;
      box-shadow: 0 4px 12px rgba(37, 211, 102, 0.4);
      transform: translateY(-1px);
      color: #ffffff;
    }

    /* TABELA DE SERVIÇOS */
    .table-servicos-container {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 24px;
      background: #ffffff;
    }
    .table-servicos {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .table-servicos th {
      background: #0f2744;
      color: #ffffff;
      padding: 10px 14px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      text-align: left;
    }
    .table-servicos td {
      padding: 12px 14px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }
    .row-alt {
      background: #f8fafc;
    }
    .servico-td-nome {
      width: 70%;
    }
    .servico-td-qtd {
      width: 14%;
      text-align: center;
      font-weight: 700;
      color: #334155;
    }
    .servico-td-status {
      width: 16%;
      text-align: right;
    }
    .badge-cat-servico {
      display: inline-block;
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 7px;
      border-radius: 4px;
      background: #e0f2fe;
      color: #0369a1;
      margin-bottom: 4px;
    }
    .servico-nome {
      font-weight: 700;
      color: #0f172a;
      font-size: 13.5px;
    }
    .servico-desc {
      font-size: 12px;
      color: #475569;
      margin-top: 2px;
      line-height: 1.4;
    }
    .badge-incluso {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      background: #ecfdf5;
      color: #047857;
      font-weight: 800;
      font-size: 11.5px;
      border: 1px solid #a7f3d0;
    }

    /* SEÇÕES DE TERMOS / OBSERVAÇÕES */
    .terms-block {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .terms-block-obs {
      background: #eff6ff;
      border-color: #bfdbfe;
    }
    .terms-block-title {
      font-size: 11.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #0f2744;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .terms-block-obs .terms-block-title {
      color: #1d4ed8;
    }
    .terms-block-content {
      font-size: 12.5px;
      color: #334155;
      line-height: 1.6;
      white-space: pre-line;
    }

    /* BANNER FLUTUANTE / CTA FIXO NO CELULAR */
    .sticky-contact-banner {
      background: linear-gradient(135deg, #0f2744, #1e4976);
      color: #ffffff;
      border-radius: 14px;
      padding: 18px 22px;
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .contact-banner-text h4 {
      font-size: 15px;
      font-weight: 800;
    }
    .contact-banner-text p {
      font-size: 12px;
      color: #bae6fd;
      margin-top: 2px;
    }
    .btn-contact-main {
      background: #25D366;
      color: #ffffff;
      font-weight: 800;
      font-size: 13.5px;
      padding: 10px 18px;
      border-radius: 8px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .btn-contact-main:hover {
      background: #20BA5A;
      color: #ffffff;
    }

    /* FOOTER */
    .footer-note {
      text-align: center;
      font-size: 11px;
      color: #64748b;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }
    .footer-note strong {
      color: #0f2744;
    }

    /* RESPONSIVIDADE MOBILE */
    @media (max-width: 640px) {
      body {
        padding: 6px;
      }
      .wrapper {
        border-radius: 12px;
      }
      .header-bar {
        padding: 16px;
        flex-direction: column;
        align-items: flex-start;
      }
      .header-meta {
        text-align: left;
        width: 100%;
        border-top: 1px solid #f1f5f9;
        padding-top: 10px;
      }
      .content-body {
        padding: 16px 14px;
      }
      .hero-dest {
        padding: 18px 16px;
        flex-direction: column;
        align-items: flex-start;
      }
      .hero-passengers-box {
        width: 100%;
        text-align: left;
      }
      .grid-info {
        grid-template-columns: 1fr;
      }
      .card-voo-header {
        flex-direction: column;
        align-items: stretch;
      }
      .card-voo-price-side {
        text-align: left;
        border-top: 1px dashed #e2e8f0;
        padding-top: 10px;
        margin-top: 4px;
      }
      .card-toggle-indicator {
        display: flex;
        justify-content: space-between;
        width: 100%;
        margin-top: 8px;
      }
      .rota-itinerario {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      .rota-divisor {
        width: 100%;
        justify-content: flex-start;
      }
      .sticky-contact-banner {
        flex-direction: column;
        align-items: stretch;
      }
      .btn-contact-main {
        justify-content: center;
      }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- Header -->
    <header class="header-bar">
      <div>
        ${logoHtml}
        <div class="header-agency-sub">
          ${agencia.cnpj_cadastur ? `${escapeHtml(agencia.cnpj_cadastur)} • ` : ''}${escapeHtml(agencia.email_contato || '')}
        </div>
      </div>
      <div class="header-meta">
        <span class="badge-quote">Proposta Comercial</span>
        <div class="quote-code">${escapeHtml(cotacao.codigo || 'COT-VIAGEM')}</div>
        <div class="quote-date">Emitida em ${formatarData(cotacao.created || new Date().toISOString())}</div>
      </div>
    </header>

    <main class="content-body">
      <!-- Hero Destino & Passageiros -->
      <section class="hero-dest">
        <div>
          <span class="hero-dest-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            Destino da Viagem
          </span>
          <h1 class="hero-dest-title">${escapeHtml(cotacao.destino)}</h1>
          <div class="hero-dest-dates">
            📅 ${formatarData(cotacao.data_ida)} até ${formatarData(cotacao.data_volta)}
            ${duracao ? `• (${duracao} dias / ${duracao > 1 ? duracao - 1 : 1} noites)` : ''}
          </div>
        </div>

        <div class="hero-passengers-box">
          <div class="passengers-label">Viajantes</div>
          <div class="passengers-count">
            ${cotacao.num_passageiros} ${cotacao.num_passageiros > 1 ? 'Adultos' : 'Adulto'}
            ${cotacao.num_criancas > 0 ? ` + ${cotacao.num_criancas} Criança(s)` : ''}
          </div>
          <div class="passengers-sub">Total: ${totalPassageiros} pessoa(s)</div>
        </div>
      </section>

      <!-- Info Cliente & Agência -->
      <section class="grid-info">
        <div class="info-card">
          <div class="info-card-title">👤 Passageiro Responsável</div>
          <div class="info-card-body">
            <p><strong>Nome:</strong> ${escapeHtml(cotacao.cliente_nome)}</p>
            ${cotacao.cliente_telefone ? `<p><strong>WhatsApp:</strong> ${escapeHtml(cotacao.cliente_telefone)}</p>` : ''}
            ${cotacao.cliente_email ? `<p><strong>E-mail:</strong> ${escapeHtml(cotacao.cliente_email)}</p>` : ''}
            ${cotacao.cliente_cpf_passaporte ? `<p><strong>Documento:</strong> ${escapeHtml(cotacao.cliente_cpf_passaporte)}</p>` : ''}
          </div>
        </div>

        <div class="info-card">
          <div class="info-card-title">🏢 Especialista em Viagens</div>
          <div class="info-card-body">
            <p><strong>${escapeHtml(agencia.nome_agencia || 'Agência de Viagens')}</strong></p>
            ${agencia.telefone_contato || agencia.whatsapp ? `<p><strong>Contato:</strong> ${escapeHtml(agencia.telefone_contato || agencia.whatsapp)}</p>` : ''}
            ${agencia.site_instagram ? `<p><strong>Canais:</strong> ${escapeHtml(agencia.site_instagram)}</p>` : ''}
          </div>
        </div>
      </section>

      <!-- SEÇÃO: OPÇÕES DE VOO -->
      <section style="margin-bottom: 24px;">
        <div class="section-header">
          <h2 class="section-title">
            ✈️ Opções de Voo Disponíveis (${opcoesVoo.length} ${opcoesVoo.length === 1 ? 'opção' : 'opções'})
          </h2>
        </div>
        <p class="section-subtitle">
          ${
            temMultiplasOpcoes
              ? 'Toque em cada cartão para expandir os horários e itinerários detalhados de cada opção:'
              : 'Confira os detalhes e horários do voo selecionado para sua viagem:'
          }
        </p>

        <!-- Lista de Cards de Voo -->
        <div id="lista-opcoes-voo">
          ${cardsVooHtml}
        </div>
      </section>

      <!-- SERVIÇOS TERRESTRES INCLUSOS (SE HOUVER) -->
      ${
        (cotacao.servicos || []).length > 0
          ? `
        <section style="margin-bottom: 24px;">
          <div class="section-header">
            <h2 class="section-title">🏨 Serviços Terrestres & Inclusões no Pacote</h2>
          </div>
          <div class="table-servicos-container">
            <table class="table-servicos">
              <thead>
                <tr>
                  <th style="width: 70%;">Item / Descrição</th>
                  <th style="width: 14%; text-align: center;">Qtd</th>
                  <th style="width: 16%; text-align: right;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${servicosRows}
              </tbody>
            </table>
          </div>
        </section>
      `
          : ''
      }

      <!-- FORMAS DE PAGAMENTO & CONDIÇÕES -->
      <section style="margin-bottom: 20px;">
        ${
          cotacao.formas_pagamento || agencia.formas_pagamento_padrao
            ? `
          <div class="terms-block">
            <div class="terms-block-title">💳 Formas de Pagamento & Condições Comerciais</div>
            <div class="terms-block-content">${escapeHtml(cotacao.formas_pagamento || agencia.formas_pagamento_padrao)}</div>
          </div>
        `
            : ''
        }

        ${
          cotacao.observacoes
            ? `
          <div class="terms-block terms-block-obs">
            <div class="terms-block-title">📌 Observações Importantes do Consultor</div>
            <div class="terms-block-content">${escapeHtml(cotacao.observacoes)}</div>
          </div>
        `
            : ''
        }

        ${
          cotacao.condicoes_gerais || agencia.condicoes_padrao
            ? `
          <div class="terms-block">
            <div class="terms-block-title">📋 Condições Gerais & Cancelamento</div>
            <div class="terms-block-content">${escapeHtml(cotacao.condicoes_gerais || agencia.condicoes_padrao)}</div>
          </div>
        `
            : ''
        }
      </section>

      <!-- BANNER DE CONTATO RÁPIDO / CTA GERAL -->
      <section class="sticky-contact-banner">
        <div class="contact-banner-text">
          <h4>Dúvidas ou deseja personalizar este roteiro?</h4>
          <p>Estamos à disposição para ajustar datas, voos e adicionar novos passeios.</p>
        </div>
        <a href="${linkWhatsAppGeral}" target="_blank" rel="noopener noreferrer" class="btn-contact-main">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          <span>Falar com o Consultor</span>
        </a>
      </section>

      <!-- Footer -->
      <footer class="footer-note">
        <p><strong>${escapeHtml(agencia.mensagem_agradecimento || 'Agradecemos a oportunidade de planejar sua viagem!')}</strong></p>
        <p style="margin-top: 4px;">${escapeHtml(agencia.nome_agencia)} • ${escapeHtml(agencia.endereco || '')} • ${escapeHtml(agencia.site_instagram || '')}</p>
      </footer>
    </main>
  </div>

  <!-- Script Embutido Puro (Sem Dependências Externas) para Accordions Interativos -->
  <script>
    function toggleCardVoo(idx) {
      var card = document.getElementById('card-voo-' + idx);
      if (!card) return;
      var isOpen = card.classList.contains('is-open');
      if (isOpen) {
        card.classList.remove('is-open');
        var toggleText = card.querySelector('.toggle-text');
        if (toggleText) toggleText.innerText = 'Ver detalhes';
      } else {
        card.classList.add('is-open');
        var toggleText = card.querySelector('.toggle-text');
        if (toggleText) toggleText.innerText = 'Ocultar detalhes';
      }
    }
  </script>
</body>
</html>`
}

/**
 * Faz download do arquivo .html autocontido para envio via WhatsApp ou e-mail.
 */
export function baixarArquivoHTMLProposta(cotacao: Cotacao, agencia: ConfiguracoesAgencia) {
  const html = gerarHTMLPropostaCliente(cotacao, agencia)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const nomeArquivo = `Proposta_${(cotacao.codigo || 'Viagem').replace(/[^a-zA-Z0-9-_]/g, '_')}_${(cotacao.cliente_nome || 'Cliente').replace(/\s+/g, '_')}.html`

  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Abre a versão HTML interativa em nova aba para pré-visualização.
 */
export function abrirPreviaHTMLProposta(cotacao: Cotacao, agencia: ConfiguracoesAgencia) {
  const html = gerarHTMLPropostaCliente(cotacao, agencia)
  const janela = window.open('', '_blank')
  if (janela) {
    janela.document.open()
    janela.document.write(html)
    janela.document.close()
  } else {
    // Fallback: download direto se popup for bloqueado
    baixarArquivoHTMLProposta(cotacao, agencia)
  }
}

/**
 * Função de impressão / PDF existente.
 */
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
