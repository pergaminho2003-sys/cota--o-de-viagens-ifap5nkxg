export interface DadosVooExtraidos {
  companhia: string
  numero_voo: string
  data_voo: string
  horario_partida: string
  horario_chegada: string
  origem: string
  destino: string
  descricao: string
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

  let companhia = ''
  let numero_voo = ''
  let data_voo = ''
  let horario_partida = ''
  let horario_chegada = ''
  let origem = ''
  let destino = ''

  // 1. Detectar Companhia
  for (const c of COMPANHIAS_CONHECIDAS) {
    if (c.padrao.test(texto)) {
      companhia = c.nome
      break
    }
  }

  // 2. Detectar Número do Voo (ex: LA8190, G3 1234, AD 4002, AA950, DL105, UA860, TP088, AF457, IB6824)
  const regexNumVoo =
    /\b(LA|JJ|G3|AD|AA|DL|UA|CM|AF|KL|EK|TK|TP|IB|AV|LH|BA|QR|AM|AR|LX|UX)\s?([0-9]{3,4})\b/i
  const matchNumVoo = texto.match(regexNumVoo)
  if (matchNumVoo) {
    numero_voo = `${matchNumVoo[1].toUpperCase()}${matchNumVoo[2]}`
    if (!companhia) {
      // Se não achou por nome mas achou código IATA
      const codigoIata = matchNumVoo[1].toUpperCase()
      const iataMap: Record<string, string> = {
        LA: 'LATAM Airlines',
        JJ: 'LATAM Airlines',
        G3: 'Gol Linhas Aéreas',
        AD: 'Azul Linhas Aéreas',
        AA: 'American Airlines',
        DL: 'Delta Air Lines',
        UA: 'United Airlines',
        CM: 'Copa Airlines',
        AF: 'Air France',
        KL: 'KLM Royal Dutch',
        EK: 'Emirates',
        TK: 'Turkish Airlines',
        TP: 'TAP Air Portugal',
        IB: 'Iberia',
        AV: 'Avianca',
        LH: 'Lufthansa',
        BA: 'British Airways',
        QR: 'Qatar Airways',
        AM: 'Aeroméxico',
        AR: 'Aerolíneas Argentinas',
      }
      if (iataMap[codigoIata]) {
        companhia = iataMap[codigoIata]
      }
    }
  }

  // 3. Detectar Data (ex: 15/06/2025, 15-06-2025, 2025-06-15, 15 Jun 2025, 15 de Junho de 2025)
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
      // Formato textual: 15 Jun 2025 / 15 de Junho de 2025
      const regexDataTexto = /\b([0-3]?[0-9])\s*(?:de\s+)?([a-zA-Z]{3,9})\s*(?:de\s+)?(202[4-9])\b/i
      const matchDataTexto = texto.match(regexDataTexto)
      if (matchDataTexto) {
        const dia = matchDataTexto[1].padStart(2, '0')
        const mesStr = matchDataTexto[2].toLowerCase().substring(0, 3)
        const ano = matchDataTexto[3]
        const mes = MESES_MAP[mesStr] || '01'
        data_voo = `${ano}-${mes}-${dia}`
      }
    }
  }

  // 4. Detectar Horários de Partida e Chegada (ex: 08:30, 8:30, 08h30, 14:45, 14:45+1, 06:15 (+1 dia))
  // Procura padrões de horário em sequência ou com palavras de partida/chegada
  const regexHorariosGerais =
    /\b([0-2]?[0-9])[:hH]([0-5][0-9])(?:\s*(?:\+1|\(\+1\)|no dia seguinte))?\b/g
  const matchesHorarios: string[] = []
  let matchH: RegExpExecArray | null
  while ((matchH = regexHorariosGerais.exec(texto)) !== null) {
    const hora = matchH[1].padStart(2, '0')
    const minuto = matchH[2]
    const diaSeguinte =
      matchH[0].includes('+1') ||
      texto.substring(matchH.index, matchH.index + 20).includes('+1') ||
      texto
        .substring(matchH.index, matchH.index + 20)
        .toLowerCase()
        .includes('seguinte')
    matchesHorarios.push(`${hora}:${minuto}${diaSeguinte ? ' (+1)' : ''}`)
  }

  if (matchesHorarios.length >= 2) {
    horario_partida = matchesHorarios[0]
    horario_chegada = matchesHorarios[1]
  } else if (matchesHorarios.length === 1) {
    horario_partida = matchesHorarios[0]
  }

  // 5. Detectar Origem e Destino (Códigos de aeroporto GRU, MIA, MCO, CDG, LIS ou nomes de cidades)
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
    'OUT',
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

  // 6. Gerar descrição sintética caso tenhamos dados suficientes
  let descricao = ''
  if (companhia || origem || destino) {
    const partes: string[] = []
    if (companhia) partes.push(companhia)
    if (origem && destino) {
      // Extrair siglas se houver
      const siglaOrigem = origem.match(/\(([A-Z]{3})/)?.[1] || origem
      const siglaDestino = destino.match(/\(([A-Z]{3})/)?.[1] || destino
      partes.push(`${siglaOrigem} → ${siglaDestino}`)
    }
    if (data_voo) {
      const [ano, mes, dia] = data_voo.split('-')
      if (dia && mes) partes.push(`${dia}/${mes}`)
    }
    descricao = partes.join(' • ')
  }

  const extraidos: DadosVooExtraidos = {
    companhia,
    numero_voo,
    data_voo,
    horario_partida,
    horario_chegada,
    origem,
    destino,
    descricao,
  }

  const confianca: Record<keyof DadosVooExtraidos, boolean> = {
    companhia: Boolean(companhia),
    numero_voo: Boolean(numero_voo),
    data_voo: Boolean(data_voo),
    horario_partida: Boolean(horario_partida),
    horario_chegada: Boolean(horario_chegada),
    origem: Boolean(origem),
    destino: Boolean(destino),
    descricao: Boolean(descricao),
  }

  return { extraidos, confianca }
}
