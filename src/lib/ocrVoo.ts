export interface DadosVooExtraidos {
  data_voo: string
  horario_partida: string
  horario_chegada: string
  origem: string
  destino: string
  descricao?: string
  companhia?: string
  numero_voo?: string
}

const COMPANHIAS_CONHECIDAS = [
  { padrao: /\b(LATAM|TAM|LAN)\b/i, nome: 'LATAM Airlines' },
  { padrao: /\b(GOL|VOEGOL)\b/i, nome: 'Gol Linhas Aéreas' },
  { padrao: /\b(AZUL|AZUL LINHAS)\b/i, nome: 'Azul Linhas Aéreas' },
  { padrao: /\b(AMERICAN|AMERICAN AIRLINES|AA)\b/i, nome: 'American Airlines' },
  { padrao: /\b(DELTA|DELTA AIR LINES)\b/i, nome: 'Delta Air Lines' },
  { padrao: /\b(UNITED|UNITED AIRLINES)\b/i, nome: 'United Airlines' },
  { padrao: /\b(COPA|COPA AIRLINES)\b/i, nome: 'Copa Airlines' },
  { padrao: /\b(AIR FRANCE|AIRFRANCE)\b/i, nome: 'Air France' },
  { padrao: /\b(KLM)\b/i, nome: 'KLM Royal Dutch' },
  { padrao: /\b(EMIRATES)\b/i, nome: 'Emirates' },
  { padrao: /\b(TURKISH|TURKISH AIRLINES)\b/i, nome: 'Turkish Airlines' },
  { padrao: /\b(TAP|TAP AIR PORTUGAL)\b/i, nome: 'TAP Air Portugal' },
  { padrao: /\b(IBERIA)\b/i, nome: 'Iberia' },
  { padrao: /\b(AVIANCA)\b/i, nome: 'Avianca' },
  { padrao: /\b(LUFTHANSA)\b/i, nome: 'Lufthansa' },
  { padrao: /\b(BRITISH AIRWAYS|BRITISH)\b/i, nome: 'British Airways' },
  { padrao: /\b(QATAR|QATAR AIRWAYS)\b/i, nome: 'Qatar Airways' },
  { padrao: /\b(AEROMEXICO|AEROMÉXICO)\b/i, nome: 'Aeroméxico' },
  { padrao: /\b(AEROLINEAS ARGENTINAS|AEROLÍNEAS ARGENTINAS)\b/i, nome: 'Aerolíneas Argentinas' },
  { padrao: /\b(SWISS)\b/i, nome: 'Swiss International Air Lines' },
  { padrao: /\b(AIR EUROPA)\b/i, nome: 'Air Europa' },
]

const AEROPORTOS_E_CIDADES: Record<string, string> = {
  GRU: 'São Paulo (Guarulhos - GRU)',
  CGH: 'São Paulo (Congonhas - CGH)',
  VCP: 'Campinas (Viracopos - VCP)',
  GIG: 'Rio de Janeiro (Galeão - GIG)',
  SDU: 'Rio de Janeiro (Santos Dumont - SDU)',
  BSB: 'Brasília (BSB)',
  CNF: 'Belo Horizonte (Confins - CNF)',
  SSA: 'Salvador (SSA)',
  REC: 'Recife (REC)',
  FOR: 'Fortaleza (FOR)',
  POA: 'Porto Alegre (POA)',
  CWB: 'Curitiba (CWB)',
  FLN: 'Florianópolis (FLN)',
  VIX: 'Vitória (VIX)',
  BEL: 'Belém (BEL)',
  MAO: 'Manaus (MAO)',
  CGB: 'Cuiabá (CGB)',
  GYN: 'Goiânia (GYN)',
  NAT: 'Natal (NAT)',
  MCZ: 'Maceió (MCZ)',
  MCO: 'Orlando (MCO)',
  MIA: 'Miami (MIA)',
  JFK: 'Nova York (JFK)',
  EWR: 'Newark (EWR)',
  LAX: 'Los Angeles (LAX)',
  LIS: 'Lisboa (LIS)',
  OPO: 'Porto (OPO)',
  MAD: 'Madri (MAD)',
  CDG: 'Paris (Charles de Gaulle - CDG)',
  ORY: 'Paris (Orly - ORY)',
  FCO: 'Roma (Fiumicino - FCO)',
  LHR: 'Londres (Heathrow - LHR)',
  AMS: 'Amsterdã (AMS)',
  FRA: 'Frankfurt (FRA)',
  EZE: 'Buenos Aires (Ezeiza - EZE)',
  AEP: 'Buenos Aires (Aeroparque - AEP)',
  SCL: 'Santiago (SCL)',
  BOG: 'Bogotá (BOG)',
  LIM: 'Lima (LIM)',
  PTY: 'Panamá (PTY)',
  CUN: 'Cancún (CUN)',
  DXB: 'Dubai (DXB)',
}

const MESES_MAP: Record<string, string> = {
  jan: '01',
  fev: '02',
  feb: '02',
  mar: '03',
  abr: '04',
  apr: '04',
  mai: '05',
  may: '05',
  jun: '06',
  jul: '07',
  ago: '08',
  aug: '08',
  set: '09',
  sep: '09',
  out: '10',
  oct: '10',
  nov: '11',
  dez: '12',
  dec: '12',
}

export function parseTextoVoo(textoBruto: string): {
  extraidos: DadosVooExtraidos
  confianca: Record<keyof DadosVooExtraidos, boolean>
} {
  const texto = textoBruto.replace(/\r\n/g, '\n')

  let data_voo = ''
  let horario_partida = ''
  let horario_chegada = ''
  let origem = ''
  let destino = ''

  // 1. Detectar Data (ex: 15/06/2025, 15-06-2025, 2025-06-15, 15 Jun 2025, 15 de Junho de 2025)
  // Formato YYYY-MM-DD
  const regexDataIso = /\b(202[4-9])-([0-1][0-9])-([0-3][0-9])\b/
  const matchDataIso = texto.match(regexDataIso)
  if (matchDataIso) {
    data_voo = `${matchDataIso[1]}-${matchDataIso[2]}-${matchDataIso[3]}`
  } else {
    // Formato DD/MM/YYYY ou DD-MM-YYYY
    const regexDataBr = /\b([0-3]?[0-9])[./-]([0-1]?[0-9])[./-](202[4-9]|\d{2})\b/
    const matchDataBr = texto.match(regexDataBr)
    if (matchDataBr) {
      const dia = matchDataBr[1].padStart(2, '0')
      const mes = matchDataBr[2].padStart(2, '0')
      let ano = matchDataBr[3]
      if (ano.length === 2) ano = `20${ano}`
      data_voo = `${ano}-${mes}-${dia}`
    } else {
      // Formato textual: 15 Jun 2025 / 15 de Junho de 2025 / 15 de jun
      const regexDataTexto =
        /\b([0-3]?[0-9])\s*(?:de\s+)?([a-zA-Z]{3,9})\s*(?:de\s+)?(202[4-9])?\b/i
      const matchDataTexto = texto.match(regexDataTexto)
      if (matchDataTexto) {
        const dia = matchDataTexto[1].padStart(2, '0')
        const mesStr = matchDataTexto[2].toLowerCase().substring(0, 3)
        const ano = matchDataTexto[3] || String(new Date().getFullYear())
        const mes = MESES_MAP[mesStr]
        if (mes) {
          data_voo = `${ano}-${mes}-${dia}`
        }
      }
    }
  }

  // 2. Detectar Horários de Partida e Chegada, diferenciando estritamente de Durações de Voo
  // Encontrar todas as posições de duração para descartar essas ocorrências
  const intervalDuracoes: Array<{ start: number; end: number }> = []

  // Durações com prefixo "Duração / Duração total / Voo de / Duração do voo:"
  const regexPrefixDuracao =
    /(?:dura[çc][ãa]o|duracao|tempo\s+de\s+voo|voo\s+de|duration)\s*:?\s*(\d{1,2}\s*[hH]\s*\d{0,2}\s*(?:m|min|mins)?|\d{1,2}:\d{2})/gi
  let matchDurPrefix: RegExpExecArray | null
  while ((matchDurPrefix = regexPrefixDuracao.exec(texto)) !== null) {
    intervalDuracoes.push({
      start: matchDurPrefix.index,
      end: matchDurPrefix.index + matchDurPrefix[0].length,
    })
  }

  // Durações com sufixo "min / mins / m" e "h / hrs / horas" (ex: "2h 30m", "2h30min", "2 h 30 min", "14h 50m", "45 min", "2 hrs")
  const regexDuracaoSufixo =
    /\b\d{1,2}\s*(?:h|hrs|horas|hr)\s*\d{1,2}\s*(?:m|min|mins|minutos)\b|\b\d{1,2}\s*(?:h|hrs|horas|hr)\b|\b\d{1,2}\s*(?:min|mins|minutos)\b/gi
  let matchDurSuf: RegExpExecArray | null
  while ((matchDurSuf = regexDuracaoSufixo.exec(texto)) !== null) {
    intervalDuracoes.push({
      start: matchDurSuf.index,
      end: matchDurSuf.index + matchDurSuf[0].length,
    })
  }

  // Função auxiliar para verificar se um índice colide com uma duração detectada
  const isDentroDeDuracao = (index: number, length: number) => {
    return intervalDuracoes.some((d) => {
      return (
        (index >= d.start && index < d.end) ||
        (index + length > d.start && index + length <= d.end) ||
        (index <= d.start && index + length >= d.end)
      )
    })
  }

  // Extração de horários de relógio: 14:05, 08:30, 8:30, 17h05, 23h55 (+1)
  const regexHorariosRelogio =
    /\b([0-2]?[0-9])[:hH]([0-5][0-9])(?:\s*(?:\+1|\(\+1\)|no dia seguinte))?\b/g
  const matchesHorarios: Array<{ horario: string; index: number; text: string }> = []
  let matchH: RegExpExecArray | null

  while ((matchH = regexHorariosRelogio.exec(texto)) !== null) {
    const idx = matchH.index
    const matchedStr = matchH[0]

    // Verificar se este match está contido em uma duração
    if (isDentroDeDuracao(idx, matchedStr.length)) {
      continue
    }

    // Verificar se imediatamente antes ou depois tem palavras que indicam duração
    const contextoAntes = texto.substring(Math.max(0, idx - 15), idx).toLowerCase()
    const contextoDepois = texto
      .substring(idx + matchedStr.length, Math.min(texto.length, idx + matchedStr.length + 15))
      .toLowerCase()
    if (
      contextoAntes.includes('dura') ||
      contextoAntes.includes('tempo') ||
      contextoDepois.startsWith('m ') ||
      contextoDepois.startsWith('min') ||
      contextoDepois.startsWith('m\n')
    ) {
      continue
    }

    const horaNum = parseInt(matchH[1], 10)
    if (horaNum > 23) continue

    const hora = String(horaNum).padStart(2, '0')
    const minuto = matchH[2]

    const diaSeguinte =
      matchedStr.includes('+1') ||
      texto.substring(idx, idx + 20).includes('+1') ||
      texto
        .substring(idx, idx + 20)
        .toLowerCase()
        .includes('seguinte')

    matchesHorarios.push({
      horario: `${hora}:${minuto}${diaSeguinte ? ' (+1)' : ''}`,
      index: idx,
      text: matchedStr,
    })
  }

  if (matchesHorarios.length >= 2) {
    horario_partida = matchesHorarios[0].horario
    horario_chegada = matchesHorarios[1].horario
  } else if (matchesHorarios.length === 1) {
    horario_partida = matchesHorarios[0].horario
  }

  // 3. Detectar Origem e Destino (Códigos de aeroporto GRU, MIA, MCO, CDG, LIS ou nomes de cidades)
  const codigosIataEncontrados: string[] = []
  const regexIata = /\b([A-Z]{3})\b/g
  let matchIata: RegExpExecArray | null
  const ignorarPalavras = new Set([
    'VOO',
    'AIR',
    'IDA',
    'OUT',
    'TOP',
    'MAX',
    'PIX',
    'CAD',
    'BRL',
    'USD',
    'EUR',
    'CPF',
    'TEL',
    'LAT',
    'GOL',
    'TAM',
    'LAN',
    'NEW',
    'THE',
    'AND',
    'FOR',
    'NOT',
    'OFF',
    'ALL',
    'HOT',
    'SPA',
    'CVC',
    'SET',
    'DEZ',
    'NOV',
    'AGO',
    'JUL',
    'JUN',
    'MAI',
    'ABR',
    'MAR',
    'FEV',
    'JAN',
    'SEG',
    'TER',
    'QUA',
    'QUI',
    'SEX',
    'SAB',
    'DOM',
    'MIN',
    'HRS',
    'HOR',
  ])

  while ((matchIata = regexIata.exec(texto)) !== null) {
    const code = matchIata[1]
    if (AEROPORTOS_E_CIDADES[code] && !ignorarPalavras.has(code)) {
      codigosIataEncontrados.push(code)
    }
  }

  // Se encontrou ao menos 2 códigos IATA reconhecidos
  if (codigosIataEncontrados.length >= 2) {
    origem = AEROPORTOS_E_CIDADES[codigosIataEncontrados[0]] || codigosIataEncontrados[0]
    destino = AEROPORTOS_E_CIDADES[codigosIataEncontrados[1]] || codigosIataEncontrados[1]
  } else if (codigosIataEncontrados.length === 1) {
    origem = AEROPORTOS_E_CIDADES[codigosIataEncontrados[0]] || codigosIataEncontrados[0]
  }

  // Caso não tenha achado códigos IATA, tentar nomes de cidades conhecidas
  if (!origem || !destino) {
    const cidadesBusca = [
      { nome: 'São Paulo', valor: 'São Paulo (GRU)' },
      { nome: 'Rio de Janeiro', valor: 'Rio de Janeiro (GIG)' },
      { nome: 'Brasília', valor: 'Brasília (BSB)' },
      { nome: 'Belo Horizonte', valor: 'Belo Horizonte (CNF)' },
      { nome: 'Salvador', valor: 'Salvador (SSA)' },
      { nome: 'Recife', valor: 'Recife (REC)' },
      { nome: 'Fortaleza', valor: 'Fortaleza (FOR)' },
      { nome: 'Porto Alegre', valor: 'Porto Alegre (POA)' },
      { nome: 'Curitiba', valor: 'Curitiba (CWB)' },
      { nome: 'Florianópolis', valor: 'Florianópolis (FLN)' },
      { nome: 'Orlando', valor: 'Orlando (MCO)' },
      { nome: 'Miami', valor: 'Miami (MIA)' },
      { nome: 'Nova York', valor: 'Nova York (JFK)' },
      { nome: 'Paris', valor: 'Paris (CDG)' },
      { nome: 'Lisboa', valor: 'Lisboa (LIS)' },
      { nome: 'Porto', valor: 'Porto (OPO)' },
      { nome: 'Madri', valor: 'Madri (MAD)' },
      { nome: 'Roma', valor: 'Roma (FCO)' },
      { nome: 'Londres', valor: 'Londres (LHR)' },
      { nome: 'Buenos Aires', valor: 'Buenos Aires (EZE)' },
      { nome: 'Santiago', valor: 'Santiago (SCL)' },
      { nome: 'Cancún', valor: 'Cancún (CUN)' },
    ]

    const cidadesAchadas: string[] = []
    for (const c of cidadesBusca) {
      if (new RegExp(`\\b${c.nome}\\b`, 'i').test(texto)) {
        cidadesAchadas.push(c.valor)
      }
    }

    if (!origem && cidadesAchadas.length > 0) {
      origem = cidadesAchadas[0]
    }
    if (!destino && cidadesAchadas.length > 1) {
      destino = cidadesAchadas[1]
    }
  }

  // 4. Descrição sintética informativa caso origem/destino ou data tenham sido encontrados
  let descricao = ''
  if (origem && destino) {
    const siglaOrigem = origem.match(/\(([A-Z]{3})/)?.[1] || origem
    const siglaDestino = destino.match(/\(([A-Z]{3})/)?.[1] || destino
    descricao = `${siglaOrigem} → ${siglaDestino}`
    if (data_voo) {
      const [ano, mes, dia] = data_voo.split('-')
      if (dia && mes) descricao += ` • ${dia}/${mes}`
    }
  }

  const extraidos: DadosVooExtraidos = {
    data_voo,
    horario_partida,
    horario_chegada,
    origem,
    destino,
    descricao,
  }

  const confianca: Record<keyof DadosVooExtraidos, boolean> = {
    data_voo: Boolean(data_voo),
    horario_partida: Boolean(horario_partida),
    horario_chegada: Boolean(horario_chegada),
    origem: Boolean(origem),
    destino: Boolean(destino),
    descricao: Boolean(descricao),
    companhia: false,
    numero_voo: false,
  }

  return { extraidos, confianca }
}
