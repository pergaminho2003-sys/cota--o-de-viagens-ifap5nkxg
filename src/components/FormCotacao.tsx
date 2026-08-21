import React, { useState, useEffect } from 'react'
import {
  Cotacao,
  ServicoItem,
  ServicoCategoria,
  CATEGORIAS_SERVICO,
  ConfiguracoesAgencia,
  StatusCotacao,
  Moeda,
  OpcaoVoo,
  STATUS_OPCAO_VOO_CONFIG,
} from '@/types/cotacao'
import { calcularOpcaoVoo, encontrarIndiceOpcaoMaisBarata, formatarMoeda } from '@/lib/calculos'
import { ModalImportarPrint } from '@/components/ModalImportarPrint'
import { DadosVooExtraidos } from '@/lib/ocrVoo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plane,
  Hotel,
  Car,
  Compass,
  ShieldCheck,
  KeySquare,
  Ship,
  Train,
  FileText,
  Package,
  Plus,
  Trash2,
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  Users,
  Eye,
  Save,
  ArrowLeft,
  Sparkles,
  Copy,
  ChevronUp,
  ChevronDown,
  Camera,
  Layers,
  ChevronRight,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'

interface FormCotacaoProps {
  cotacaoInicial?: Cotacao | null
  configAgencia: ConfiguracoesAgencia
  onSalvar: (
    dados: Omit<Cotacao, 'id' | 'created' | 'updated'> & { opcoes_voo?: OpcaoVoo[] },
    id?: string,
  ) => Promise<void>
  onCancelar: () => void
  onVisualizar: (cotacao: Cotacao) => void
  salvando?: boolean
}

export function FormCotacao({
  cotacaoInicial,
  configAgencia,
  onSalvar,
  onCancelar,
  onVisualizar,
  salvando = false,
}: FormCotacaoProps) {
  // Dados principais
  const [codigo, setCodigo] = useState(cotacaoInicial?.codigo || '')
  const [clienteNome, setClienteNome] = useState(cotacaoInicial?.cliente_nome || '')
  const [clienteEmail, setClienteEmail] = useState(cotacaoInicial?.cliente_email || '')
  const [clienteTelefone, setClienteTelefone] = useState(cotacaoInicial?.cliente_telefone || '')
  const [clienteCpfPassaporte, setClienteCpfPassaporte] = useState(
    cotacaoInicial?.cliente_cpf_passaporte || '',
  )

  const [destino, setDestino] = useState(cotacaoInicial?.destino || '')
  const [dataIda, setDataIda] = useState(cotacaoInicial?.data_ida || '')
  const [dataVolta, setDataVolta] = useState(cotacaoInicial?.data_volta || '')
  const [numPassageiros, setNumPassageiros] = useState<number>(cotacaoInicial?.num_passageiros ?? 2)
  const [numCriancas, setNumCriancas] = useState<number>(cotacaoInicial?.num_criancas ?? 0)
  const [status, setStatus] = useState<StatusCotacao>(cotacaoInicial?.status || 'rascunho')

  const [moeda, setMoeda] = useState<Moeda>(cotacaoInicial?.moeda || 'BRL')
  const [cotacaoMoeda, setCotacaoMoeda] = useState<number>(cotacaoInicial?.cotacao_moeda ?? 1)
  const [desconto, setDesconto] = useState<number>(cotacaoInicial?.desconto ?? 0)
  const [taxasAdicionais, setTaxasAdicionais] = useState<number>(
    cotacaoInicial?.taxas_adicionais ?? 0,
  )

  // Serviços avulsos (Hotéis, transfers, passeios, seguros, etc.)
  const [servicos, setServicos] = useState<ServicoItem[]>(cotacaoInicial?.servicos || [])

  // Termos e Condições
  const [observacoes, setObservacoes] = useState(cotacaoInicial?.observacoes || '')
  const [condicoesGerais, setCondicoesGerais] = useState(
    cotacaoInicial?.condicoes_gerais || configAgencia.condicoes_padrao || '',
  )
  const [formasPagamento, setFormasPagamento] = useState(
    cotacaoInicial?.formas_pagamento || configAgencia.formas_pagamento_padrao || '',
  )
  const [validadeDias, setValidadeDias] = useState<number>(
    cotacaoInicial?.validade_dias || configAgencia.validade_padrao_dias || 7,
  )
  const [dataValidade, setDataValidade] = useState(cotacaoInicial?.data_validade || '')

  const impostoAliquotaPadrao =
    configAgencia.imposto_lucro_padrao !== undefined ? configAgencia.imposto_lucro_padrao : 6
  const margemPadrao = configAgencia.margem_padrao !== undefined ? configAgencia.margem_padrao : 15

  // Opções de Voo Independentes
  const [opcoesVoo, setOpcoesVoo] = useState<OpcaoVoo[]>(() => {
    if (cotacaoInicial?.opcoes_voo && cotacaoInicial.opcoes_voo.length > 0) {
      return cotacaoInicial.opcoes_voo.map((op, idx) => ({
        ...op,
        observacao: op.observacao || '',
        ordem: op.ordem !== undefined ? op.ordem : idx,
      }))
    }
    // Criação inicial com 1 opção padrão
    return [
      {
        id: `opcao-${Date.now()}-0`,
        descricao: 'LATAM • GRU → Destino',
        observacao: '',
        companhia: 'LATAM Airlines',
        numero_voo: '',
        data_voo: cotacaoInicial?.data_ida || '',
        horario_partida: '08:30',
        horario_chegada: '16:45',
        origem: 'São Paulo (GRU)',
        destino: cotacaoInicial?.destino || '',
        custo: 3500,
        margem_desejada: margemPadrao,
        imposto_percentual: impostoAliquotaPadrao,
        preco_mercado: 4800,
        modo_precificacao: 'margem',
        desconto_mercado_percentual: 10,
        ordem: 0,
      },
    ]
  })

  // Estado do Modal de OCR
  const [modalOcrAberto, setModalOcrAberto] = useState(false)
  const [opcaoVooOcrIndex, setOpcaoVooOcrIndex] = useState<number | null>(null)

  // Inicializar data de validade
  useEffect(() => {
    if (!dataValidade && validadeDias) {
      const d = new Date()
      d.setDate(d.getDate() + validadeDias)
      setDataValidade(d.toISOString().split('T')[0])
    }
  }, [validadeDias, dataValidade])

  // Gerenciamento de Opções de Voo
  const handleAdicionarOpcaoVoo = () => {
    const novoIndex = opcoesVoo.length
    const novaOpcao: OpcaoVoo = {
      id: `opcao-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      descricao: `Opção ${novoIndex + 1} • ${destino || 'Voo'}`,
      observacao: '',
      companhia: '',
      numero_voo: '',
      data_voo: dataIda || '',
      horario_partida: '',
      horario_chegada: '',
      origem: opcoesVoo[0]?.origem || 'São Paulo (GRU)',
      destino: destino || opcoesVoo[0]?.destino || '',
      custo: 0,
      margem_desejada: margemPadrao,
      imposto_percentual: impostoAliquotaPadrao,
      preco_mercado: undefined,
      modo_precificacao: 'margem',
      desconto_mercado_percentual: 10,
      ordem: novoIndex,
    }
    setOpcoesVoo([...opcoesVoo, novaOpcao])
    toast.success(`Opção de voo #${novoIndex + 1} adicionada!`)
  }

  const handleRemoverOpcaoVoo = (index: number) => {
    if (opcoesVoo.length <= 1) {
      toast.warning('A cotação precisa ter ao menos uma opção de voo.')
      return
    }
    const novas = opcoesVoo.filter((_, i) => i !== index).map((op, i) => ({ ...op, ordem: i }))
    setOpcoesVoo(novas)
    toast.info('Opção de voo removida.')
  }

  const handleDuplicarOpcaoVoo = (index: number) => {
    const item = opcoesVoo[index]
    const duplicada: OpcaoVoo = {
      ...item,
      id: `opcao-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      descricao: `${item.descricao || item.companhia || 'Voo'} (Cópia)`,
      observacao: item.observacao || '',
      ordem: index + 1,
    }
    const novas = [...opcoesVoo]
    novas.splice(index + 1, 0, duplicada)
    setOpcoesVoo(novas.map((op, i) => ({ ...op, ordem: i })))
    toast.success('Opção de voo duplicada!')
  }

  const handleMoverOpcao = (index: number, direcao: 'cima' | 'baixo') => {
    if (
      (direcao === 'cima' && index === 0) ||
      (direcao === 'baixo' && index === opcoesVoo.length - 1)
    ) {
      return
    }
    const novoIndex = direcao === 'cima' ? index - 1 : index + 1
    const novas = [...opcoesVoo]
    const temp = novas[index]
    novas[index] = novas[novoIndex]
    novas[novoIndex] = temp
    setOpcoesVoo(novas.map((op, i) => ({ ...op, ordem: i })))
  }

  const handleAtualizarOpcao = (index: number, campo: keyof OpcaoVoo, valor: any) => {
    setOpcoesVoo((prev) => {
      const novas = [...prev]
      novas[index] = { ...novas[index], [campo]: valor }
      return novas
    })
  }

  // Acionar OCR para uma opção específica
  const handleAbrirOcrParaOpcao = (index: number) => {
    setOpcaoVooOcrIndex(index)
    setModalOcrAberto(true)
  }

  const handleAplicarDadosOcr = (dados: Partial<DadosVooExtraidos>) => {
    if (opcaoVooOcrIndex === null || opcaoVooOcrIndex >= opcoesVoo.length) return

    setOpcoesVoo((prev) => {
      const novas = [...prev]
      const atual = novas[opcaoVooOcrIndex]
      const cia = dados.companhia || atual.companhia
      const origemTexto = dados.origem || atual.origem
      const destinoTexto = dados.destino || atual.destino
      const novaDescricao =
        dados.descricao ||
        (cia ? `${cia} • ${origemTexto} → ${destinoTexto}` : `${origemTexto} → ${destinoTexto}`) ||
        atual.descricao

      novas[opcaoVooOcrIndex] = {
        ...atual,
        companhia: cia,
        numero_voo: dados.numero_voo || atual.numero_voo,
        data_voo: dados.data_voo || atual.data_voo,
        horario_partida: dados.horario_partida || atual.horario_partida,
        horario_chegada: dados.horario_chegada || atual.horario_chegada,
        origem: origemTexto,
        destino: destinoTexto,
        descricao: novaDescricao,
      }
      return novas
    })

    // Se o destino principal da cotação estiver vazio, preencher
    if (!destino && dados.destino) {
      setDestino(dados.destino)
    }
    if (!dataIda && dados.data_voo) {
      setDataIda(dados.data_voo)
    }
  }

  // Serviços Adicionais (Hotel, Transfer, etc.)
  const handleAdicionarServico = (categoriaPadrao: ServicoCategoria = 'hospedagem') => {
    const novoItem: ServicoItem = {
      id: `srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      categoria: categoriaPadrao,
      nome: '',
      descricao: '',
      fornecedor: '',
      quantidade: 1,
      valor_unitario: 0,
      valor_custo_total: 0,
      observacoes: '',
    }
    setServicos([...servicos, novoItem])
  }

  const handleRemoverServico = (id: string) => {
    setServicos(servicos.filter((s) => s.id !== id))
  }

  const handleAtualizarServico = (id: string, campo: keyof ServicoItem, valor: any) => {
    setServicos((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s
        const atualizado = { ...s, [campo]: valor }
        if (campo === 'quantidade' || campo === 'valor_unitario') {
          const qtd = campo === 'quantidade' ? Number(valor) : s.quantidade || 1
          const unit = campo === 'valor_unitario' ? Number(valor) : s.valor_unitario || 0
          atualizado.valor_custo_total = qtd * unit
        }
        return atualizado
      }),
    )
  }

  // Montar objeto de cotação completo
  const montarObjetoCotacao = (): Cotacao => {
    // Pegar a primeira opção para os totais gerais da cotação
    const opcaoPrincipal: OpcaoVoo = opcoesVoo[0] || {
      companhia: '',
      origem: '',
      destino: '',
      observacao: '',
      custo: 0,
      margem_desejada: margemPadrao,
      imposto_percentual: impostoAliquotaPadrao,
      modo_precificacao: 'margem',
      ordem: 0,
    }

    const margemPrincipal =
      opcaoPrincipal.margem_desejada !== undefined &&
      opcaoPrincipal.margem_desejada !== null &&
      !isNaN(Number(opcaoPrincipal.margem_desejada))
        ? Number(opcaoPrincipal.margem_desejada)
        : margemPadrao

    const impostoPrincipal =
      opcaoPrincipal.imposto_percentual !== undefined &&
      opcaoPrincipal.imposto_percentual !== null &&
      !isNaN(Number(opcaoPrincipal.imposto_percentual))
        ? Number(opcaoPrincipal.imposto_percentual)
        : impostoAliquotaPadrao

    const calculoPrincipal = calcularOpcaoVoo({
      custo: opcaoPrincipal.custo || 0,
      margem_desejada: margemPrincipal,
      imposto_percentual: impostoPrincipal,
      preco_mercado: opcaoPrincipal.preco_mercado,
      modo_precificacao: opcaoPrincipal.modo_precificacao || 'margem',
      desconto_mercado_percentual: opcaoPrincipal.desconto_mercado_percentual,
    })

    return {
      id: cotacaoInicial?.id,
      codigo: codigo || `COT-${new Date().getFullYear()}-NOVA`,
      cliente_nome: clienteNome,
      cliente_email: clienteEmail,
      cliente_telefone: clienteTelefone,
      cliente_cpf_passaporte: clienteCpfPassaporte,
      destino,
      data_ida: dataIda,
      data_volta: dataVolta,
      num_passageiros: numPassageiros,
      num_criancas: numCriancas,
      status,
      servicos,
      opcoes_voo: opcoesVoo,
      modo_precificacao: opcaoPrincipal.modo_precificacao || 'margem',
      margem_lucro: margemPrincipal,
      desconto_mercado_percentual: opcaoPrincipal.desconto_mercado_percentual,
      desconto,
      taxas_adicionais: taxasAdicionais,
      moeda,
      cotacao_moeda: cotacaoMoeda,
      valor_custo_total: calculoPrincipal.custo,
      valor_lucro: calculoPrincipal.lucroBruto,
      valor_venda_total: calculoPrincipal.precoFinal,
      preco_mercado: opcaoPrincipal.preco_mercado,
      observacoes,
      condicoes_gerais: condicoesGerais,
      formas_pagamento: formasPagamento,
      validade_dias: validadeDias,
      data_validade: dataValidade,
      created: cotacaoInicial?.created,
      updated: cotacaoInicial?.updated,
    }
  }

  const validarFormulario = (): boolean => {
    if (!clienteNome.trim()) {
      toast.error('Informe o nome do cliente')
      return false
    }
    if (!destino.trim()) {
      toast.error('Informe o destino da viagem')
      return false
    }
    if (opcoesVoo.length === 0) {
      toast.error('Adicione pelo menos uma opção de voo à cotação')
      return false
    }

    for (let i = 0; i < opcoesVoo.length; i++) {
      const op = opcoesVoo[i]
      if (!op.companhia.trim() && !op.descricao?.trim()) {
        toast.error(`Opção de voo #${i + 1}: Informe a companhia aérea ou descrição do voo.`)
        return false
      }
      if (op.modo_precificacao === 'desconto_mercado') {
        if (!op.preco_mercado || op.preco_mercado <= 0) {
          toast.error(
            `Opção #${i + 1}: No Modo B (Desconto de Mercado), o Preço de Mercado é obrigatório.`,
          )
          return false
        }
      }
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validarFormulario()) return
    const payload = montarObjetoCotacao()
    await onSalvar(payload, cotacaoInicial?.id)
  }

  const handlePrevisualizar = () => {
    if (!clienteNome.trim() || !destino.trim()) {
      toast.error('Preencha ao menos o nome do cliente e o destino para visualizar a cotação')
      return
    }
    const cotacao = montarObjetoCotacao()
    onVisualizar(cotacao)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancelar}
            className="text-slate-600 hover:text-slate-900 border-slate-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {cotacaoInicial
                ? `Editar Cotação #${cotacaoInicial.codigo}`
                : 'Nova Cotação com Múltiplas Opções'}
            </h1>
            <p className="text-xs text-slate-500">
              Cadastre múltiplas opções de voo com cálculo independente e preenchimento por print
              (OCR)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevisualizar}
            className="flex-1 sm:flex-none border-sky-300 text-sky-800 bg-sky-50/70 hover:bg-sky-100 font-semibold"
          >
            <Eye className="w-4 h-4 mr-1.5 text-sky-600" />
            Visualizar / PDF
          </Button>
          <Button
            type="submit"
            disabled={salvando}
            className="flex-1 sm:flex-none bg-sky-800 hover:bg-sky-900 text-white font-bold shadow-sm"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {salvando ? 'Salvando...' : 'Salvar Cotação'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Columns (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Dados do Cliente */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/60 pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-sky-800 font-bold text-xs">
                    1
                  </div>
                  <CardTitle className="text-base font-bold text-slate-800">
                    Dados do Cliente
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="status" className="text-xs text-slate-500 font-medium">
                    Status:
                  </Label>
                  <Select value={status} onValueChange={(val: StatusCotacao) => setStatus(val)}>
                    <SelectTrigger className="w-32 h-8 text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="enviada">Enviada</SelectItem>
                      <SelectItem value="aprovada">Aprovada</SelectItem>
                      <SelectItem value="recusada">Não Fechada</SelectItem>
                      <SelectItem value="finalizada">Finalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="clienteNome" className="text-xs font-bold text-slate-700">
                    Nome Completo do Cliente *
                  </Label>
                  <Input
                    id="clienteNome"
                    required
                    placeholder="Ex: João da Silva / Família Mascarin"
                    value={clienteNome}
                    onChange={(e) => setClienteNome(e.target.value)}
                    className="font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="clienteTelefone" className="text-xs font-bold text-slate-700">
                    Telefone / WhatsApp
                  </Label>
                  <Input
                    id="clienteTelefone"
                    placeholder="(11) 99999-9999"
                    value={clienteTelefone}
                    onChange={(e) => setClienteTelefone(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="clienteEmail" className="text-xs font-bold text-slate-700">
                    E-mail do Cliente
                  </Label>
                  <Input
                    id="clienteEmail"
                    type="email"
                    placeholder="cliente@email.com"
                    value={clienteEmail}
                    onChange={(e) => setClienteEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label
                    htmlFor="clienteCpfPassaporte"
                    className="text-xs font-bold text-slate-700"
                  >
                    CPF ou Passaporte (Opcional)
                  </Label>
                  <Input
                    id="clienteCpfPassaporte"
                    placeholder="000.000.000-00 ou Número de Passaporte"
                    value={clienteCpfPassaporte}
                    onChange={(e) => setClienteCpfPassaporte(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Destino e Datas da Viagem */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/60 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-sky-800 font-bold text-xs">
                  2
                </div>
                <CardTitle className="text-base font-bold text-slate-800">
                  Destino & Passageiros
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="destino" className="text-xs font-bold text-slate-700">
                    Destino Principal / Roteiro *
                  </Label>
                  <Input
                    id="destino"
                    required
                    placeholder="Ex: Orlando (Disney) | Paris & Roma | Miami"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    className="font-medium text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="dataIda"
                    className="text-xs font-bold text-slate-700 flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    Data de Ida
                  </Label>
                  <Input
                    id="dataIda"
                    type="date"
                    value={dataIda}
                    onChange={(e) => setDataIda(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="dataVolta"
                    className="text-xs font-bold text-slate-700 flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    Data de Volta
                  </Label>
                  <Input
                    id="dataVolta"
                    type="date"
                    value={dataVolta}
                    onChange={(e) => setDataVolta(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="numPassageiros"
                    className="text-xs font-bold text-slate-700 flex items-center gap-1"
                  >
                    <Users className="w-3.5 h-3.5 text-sky-600" />
                    Adultos
                  </Label>
                  <Input
                    id="numPassageiros"
                    type="number"
                    min="1"
                    value={numPassageiros}
                    onChange={(e) => setNumPassageiros(parseInt(e.target.value, 10) || 1)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="numCriancas" className="text-xs font-bold text-slate-700">
                    Crianças / Bebês
                  </Label>
                  <Input
                    id="numCriancas"
                    type="number"
                    min="0"
                    value={numCriancas}
                    onChange={(e) => setNumCriancas(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: AJUSTE 1 — MÚLTIPLAS OPÇÕES DE VOO COM CÁLCULO INDEPENDENTE */}
          <Card className="border-sky-200 shadow-md bg-gradient-to-b from-white to-sky-50/20">
            <CardHeader className="bg-sky-950 text-white pb-3 rounded-t-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold text-xs">
                    3
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                      <Plane className="w-4 h-4 text-sky-400" />
                      Opções de Voo Independentes ({opcoesVoo.length})
                    </CardTitle>
                    <CardDescription className="text-xs text-sky-200">
                      Cada opção possui custo, margem e precificação independentes.
                    </CardDescription>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleAdicionarOpcaoVoo}
                  className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Outra Opção de Voo
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-6">
              {(() => {
                const indiceMaisBarata = encontrarIndiceOpcaoMaisBarata(opcoesVoo)
                return (
                  <>
                    {opcoesVoo.map((opcao, index) => {
                      const calc = calcularOpcaoVoo({
                        custo: opcao.custo,
                        margem_desejada: opcao.margem_desejada,
                        imposto_percentual: opcao.imposto_percentual,
                        preco_mercado: opcao.preco_mercado,
                        modo_precificacao: opcao.modo_precificacao,
                        desconto_mercado_percentual: opcao.desconto_mercado_percentual,
                      })

                      const isMaisBarata = indiceMaisBarata === index

                      return (
                        <div
                          key={opcao.id || index}
                          className="border-2 border-slate-200 hover:border-sky-400 bg-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-5 transition relative"
                        >
                          {/* Header da Opção */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded">
                                Opção #{index + 1}
                              </span>

                              {/* Tag Automática "Mais barata" */}
                              {isMaisBarata && (
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-300 flex items-center gap-1">
                                  💲 Mais barata
                                </span>
                              )}

                              {/* Destaque / Observação Livre se preenchido */}
                              {opcao.observacao && opcao.observacao.trim() && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                  💬 {opcao.observacao.trim()}
                                </span>
                              )}

                              <span className="text-xs font-bold text-slate-800">
                                {opcao.descricao ||
                                  `${opcao.companhia || 'Voo'} ${opcao.origem ? `• ${opcao.origem}` : ''}`}
                              </span>
                            </div>

                            {/* Ações da Opção: OCR, Reordenar, Duplicar, Excluir */}
                            <div className="flex items-center gap-1 self-end sm:self-auto">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAbrirOcrParaOpcao(index)}
                                title="Importar dados de print do voo com OCR"
                                className="h-7 text-xs font-bold bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                              >
                                <Camera className="w-3.5 h-3.5 mr-1 text-amber-600" />📸 Importar de
                                print
                              </Button>

                              {/* Botões Reordenar ▲▼ */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={index === 0}
                                onClick={() => handleMoverOpcao(index, 'cima')}
                                title="Mover para cima"
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={index === opcoesVoo.length - 1}
                                onClick={() => handleMoverOpcao(index, 'baixo')}
                                title="Mover para baixo"
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </Button>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDuplicarOpcaoVoo(index)}
                                title="Duplicar esta opção"
                                className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>

                              {opcoesVoo.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoverOpcaoVoo(index)}
                                  title="Remover esta opção"
                                  className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Campos Descritivos do Voo */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                            <div className="sm:col-span-5 space-y-1">
                              <Label className="text-[11px] font-bold text-slate-700">
                                Companhia Aérea *
                              </Label>
                              <Input
                                placeholder="Ex: LATAM, Gol, Azul, American Airlines"
                                value={opcao.companhia}
                                onChange={(e) =>
                                  handleAtualizarOpcao(index, 'companhia', e.target.value)
                                }
                                className="h-8 text-xs font-semibold"
                              />
                            </div>

                            <div className="sm:col-span-3 space-y-1">
                              <Label className="text-[11px] font-bold text-slate-700">
                                Nº do Voo
                              </Label>
                              <Input
                                placeholder="Ex: LA8190, G3 1234"
                                value={opcao.numero_voo || ''}
                                onChange={(e) =>
                                  handleAtualizarOpcao(index, 'numero_voo', e.target.value)
                                }
                                className="h-8 text-xs"
                              />
                            </div>

                            <div className="sm:col-span-4 space-y-1">
                              <Label className="text-[11px] font-bold text-slate-700">
                                Data do Voo
                              </Label>
                              <Input
                                type="date"
                                value={opcao.data_voo || ''}
                                onChange={(e) =>
                                  handleAtualizarOpcao(index, 'data_voo', e.target.value)
                                }
                                className="h-8 text-xs"
                              />
                            </div>

                            <div className="sm:col-span-4 space-y-1">
                              <Label className="text-[11px] font-bold text-slate-700">Origem</Label>
                              <Input
                                placeholder="Ex: São Paulo (GRU)"
                                value={opcao.origem || ''}
                                onChange={(e) =>
                                  handleAtualizarOpcao(index, 'origem', e.target.value)
                                }
                                className="h-8 text-xs"
                              />
                            </div>

                            <div className="sm:col-span-4 space-y-1">
                              <Label className="text-[11px] font-bold text-slate-700">
                                Destino
                              </Label>
                              <Input
                                placeholder="Ex: Orlando (MCO)"
                                value={opcao.destino || ''}
                                onChange={(e) =>
                                  handleAtualizarOpcao(index, 'destino', e.target.value)
                                }
                                className="h-8 text-xs"
                              />
                            </div>

                            <div className="sm:col-span-2 space-y-1">
                              <Label className="text-[11px] font-bold text-slate-700">
                                Partida
                              </Label>
                              <Input
                                placeholder="Ex: 08:30"
                                value={opcao.horario_partida || ''}
                                onChange={(e) =>
                                  handleAtualizarOpcao(index, 'horario_partida', e.target.value)
                                }
                                className="h-8 text-xs"
                              />
                            </div>

                            <div className="sm:col-span-2 space-y-1">
                              <Label className="text-[11px] font-bold text-slate-700">
                                Chegada
                              </Label>
                              <Input
                                placeholder="Ex: 16:45"
                                value={opcao.horario_chegada || ''}
                                onChange={(e) =>
                                  handleAtualizarOpcao(index, 'horario_chegada', e.target.value)
                                }
                                className="h-8 text-xs"
                              />
                            </div>

                            <div className="sm:col-span-12 space-y-1">
                              <Label className="text-[11px] font-bold text-slate-700">
                                Título / Descrição Comercial (Exibido na Proposta)
                              </Label>
                              <Input
                                placeholder="Ex: LATAM Direto • GRU → MCO • Bagagem inclusa"
                                value={opcao.descricao || ''}
                                onChange={(e) =>
                                  handleAtualizarOpcao(index, 'descricao', e.target.value)
                                }
                                className="h-8 text-xs text-slate-700"
                              />
                            </div>

                            {/* Campo de Texto Livre Opcional (Observação / Destaque) */}
                            <div className="sm:col-span-12 space-y-1">
                              <Label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                <span>Observação / Destaque Livre (Opcional)</span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  — ex: melhor horário, sem conexão, bagagem despachada
                                </span>
                              </Label>
                              <Input
                                placeholder="Ex: melhor horário / sem conexão / voo noturno"
                                value={opcao.observacao || ''}
                                onChange={(e) =>
                                  handleAtualizarOpcao(index, 'observacao', e.target.value)
                                }
                                className="h-8 text-xs text-slate-800 bg-amber-50/30 border-amber-200/70 focus:border-amber-400"
                              />
                            </div>
                          </div>

                          {/* Precificação Independente desta Opção */}
                          <div className="bg-slate-900 text-white rounded-xl p-4 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                              <span className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                                <DollarSign className="w-4 h-4 text-sky-400" />
                                Precificação da Opção #{index + 1}
                              </span>

                              {/* Seletor de Modo de Precificação */}
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-slate-400">Modo:</span>
                                <div className="flex rounded-lg overflow-hidden border border-slate-700">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAtualizarOpcao(index, 'modo_precificacao', 'margem')
                                    }
                                    className={`px-2.5 py-1 text-xs font-bold transition ${
                                      opcao.modo_precificacao === 'margem'
                                        ? 'bg-sky-600 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    Modo A (Margem)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleAtualizarOpcao(
                                        index,
                                        'modo_precificacao',
                                        'desconto_mercado',
                                      )
                                    }
                                    className={`px-2.5 py-1 text-xs font-bold transition ${
                                      opcao.modo_precificacao === 'desconto_mercado'
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    Modo B (Desc. Mercado)
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Inputs Financeiros */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                              <div className="sm:col-span-4 space-y-1">
                                <Label className="text-[11px] font-bold text-slate-300">
                                  Custo do Voo ({moeda}) *
                                </Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={opcao.custo}
                                  onChange={(e) =>
                                    handleAtualizarOpcao(
                                      index,
                                      'custo',
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  className="h-8 text-xs bg-slate-950 border-slate-700 text-white font-bold"
                                />
                              </div>

                              {opcao.modo_precificacao === 'margem' ? (
                                <>
                                  <div className="sm:col-span-4 space-y-1">
                                    <div className="flex justify-between items-center">
                                      <Label className="text-[11px] font-bold text-sky-300">
                                        Margem Desejada (%)
                                      </Label>
                                      <span className="text-xs font-black text-sky-400">
                                        {opcao.margem_desejada}%
                                      </span>
                                    </div>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      value={
                                        opcao.margem_desejada !== undefined &&
                                        opcao.margem_desejada !== null &&
                                        !isNaN(opcao.margem_desejada)
                                          ? opcao.margem_desejada
                                          : ''
                                      }
                                      onChange={(e) => {
                                        const val = e.target.value
                                        handleAtualizarOpcao(
                                          index,
                                          'margem_desejada',
                                          val === '' ? 0 : parseFloat(val) || 0,
                                        )
                                      }}
                                      className="h-8 text-xs bg-slate-950 border-slate-700 text-white font-bold"
                                    />
                                  </div>

                                  <div className="sm:col-span-4 space-y-1">
                                    <Label className="text-[11px] text-slate-400">
                                      Preço de Mercado ({moeda}) - Opcional
                                    </Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="Ex: 5000.00"
                                      value={
                                        opcao.preco_mercado !== undefined ? opcao.preco_mercado : ''
                                      }
                                      onChange={(e) => {
                                        const val = e.target.value
                                        handleAtualizarOpcao(
                                          index,
                                          'preco_mercado',
                                          val === '' ? undefined : parseFloat(val),
                                        )
                                      }}
                                      className="h-8 text-xs bg-slate-950 border-slate-700 text-white"
                                    />
                                  </div>

                                  {/* Atalhos Rápidos de Margem */}
                                  <div className="sm:col-span-12 flex items-center gap-1.5 pt-1">
                                    <span className="text-[10px] text-slate-400">
                                      Atalhos Margem:
                                    </span>
                                    {[25, 30, 35, 40, 45, 50].map((marg) => (
                                      <Button
                                        key={marg}
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleAtualizarOpcao(index, 'margem_desejada', marg)
                                        }
                                        className={`h-6 px-1.5 text-[10px] font-bold ${
                                          opcao.margem_desejada === marg
                                            ? 'bg-sky-600 text-white border-sky-400'
                                            : 'bg-slate-800 text-slate-300 border-slate-700'
                                        }`}
                                      >
                                        {marg}%
                                      </Button>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="sm:col-span-4 space-y-1">
                                    <Label className="text-[11px] font-bold text-amber-300">
                                      Preço de Mercado ({moeda}) *
                                    </Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      required
                                      placeholder="Ex: 6000.00"
                                      value={
                                        opcao.preco_mercado !== undefined ? opcao.preco_mercado : ''
                                      }
                                      onChange={(e) => {
                                        const val = e.target.value
                                        handleAtualizarOpcao(
                                          index,
                                          'preco_mercado',
                                          val === '' ? undefined : parseFloat(val),
                                        )
                                      }}
                                      className="h-8 text-xs bg-slate-950 border-amber-600 text-white font-bold"
                                    />
                                  </div>

                                  <div className="sm:col-span-4 space-y-1">
                                    <div className="flex justify-between items-center">
                                      <Label className="text-[11px] font-bold text-amber-300">
                                        Desconto % que vou dar *
                                      </Label>
                                      <span className="text-xs font-black text-amber-400">
                                        {opcao.desconto_mercado_percentual}% OFF
                                      </span>
                                    </div>
                                    <Input
                                      type="number"
                                      min="0"
                                      max="90"
                                      step="0.5"
                                      value={opcao.desconto_mercado_percentual || 10}
                                      onChange={(e) =>
                                        handleAtualizarOpcao(
                                          index,
                                          'desconto_mercado_percentual',
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      className="h-8 text-xs bg-slate-950 border-amber-600 text-white font-bold"
                                    />
                                  </div>

                                  {/* Atalhos Rápidos de Desconto */}
                                  <div className="sm:col-span-12 flex items-center gap-1.5 pt-1">
                                    <span className="text-[10px] text-amber-300/80">
                                      Atalhos Desconto:
                                    </span>
                                    {[5, 8, 10, 12, 15].map((desc) => (
                                      <Button
                                        key={desc}
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleAtualizarOpcao(
                                            index,
                                            'desconto_mercado_percentual',
                                            desc,
                                          )
                                        }
                                        className={`h-6 px-1.5 text-[10px] font-bold ${
                                          opcao.desconto_mercado_percentual === desc
                                            ? 'bg-amber-600 text-white border-amber-400'
                                            : 'bg-slate-800 text-slate-300 border-slate-700'
                                        }`}
                                      >
                                        {desc}%
                                      </Button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>

                            {/* CARD INTERNO: DECISÃO INTERNA DA OPÇÃO (MODO A VS MODO B) — UM POR OPÇÃO */}
                            <div className="pt-3 border-t border-slate-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                  Decisão Interna (Opção #{index + 1})
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                  Preço Final: {formatarMoeda(calc.precoFinal, moeda)}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {/* Cenário A */}
                                <div
                                  onClick={() =>
                                    handleAtualizarOpcao(index, 'modo_precificacao', 'margem')
                                  }
                                  className={`p-2.5 rounded-lg border cursor-pointer transition ${
                                    opcao.modo_precificacao === 'margem'
                                      ? 'bg-sky-950/80 border-sky-400 ring-1 ring-sky-400'
                                      : 'bg-slate-950/40 border-slate-800 opacity-60'
                                  }`}
                                >
                                  <div className="flex justify-between font-bold text-white text-[11px] pb-1 border-b border-slate-800">
                                    <span>Modo A (Margem)</span>
                                    <span>{formatarMoeda(calc.cenarioA.precoFinal, moeda)}</span>
                                  </div>
                                  <div className="mt-1 space-y-0.5 text-[10.5px]">
                                    <div className="flex justify-between text-emerald-400">
                                      <span>Margem Bruta:</span>
                                      <span>
                                        {calc.cenarioA.margemBrutaPercent.toFixed(1)}% (
                                        {formatarMoeda(calc.cenarioA.lucroBruto, moeda)})
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-emerald-300">
                                      <span>Margem Líquida:</span>
                                      <span>
                                        {calc.cenarioA.margemLiquidaPercent.toFixed(1)}% (
                                        {formatarMoeda(calc.cenarioA.lucroLiquido, moeda)})
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Cenário B */}
                                <div
                                  onClick={() =>
                                    handleAtualizarOpcao(
                                      index,
                                      'modo_precificacao',
                                      'desconto_mercado',
                                    )
                                  }
                                  className={`p-2.5 rounded-lg border cursor-pointer transition ${
                                    opcao.modo_precificacao === 'desconto_mercado'
                                      ? 'bg-amber-950/80 border-amber-400 ring-1 ring-amber-400'
                                      : 'bg-slate-950/40 border-slate-800 opacity-60'
                                  }`}
                                >
                                  <div className="flex justify-between font-bold text-white text-[11px] pb-1 border-b border-slate-800">
                                    <span>Modo B (Desc. Mercado)</span>
                                    <span>
                                      {calc.cenarioB.valido
                                        ? formatarMoeda(calc.cenarioB.precoFinal, moeda)
                                        : 'Defina mercado'}
                                    </span>
                                  </div>
                                  <div className="mt-1 space-y-0.5 text-[10.5px]">
                                    <div className="flex justify-between text-amber-300">
                                      <span>Desconto:</span>
                                      <span>{opcao.desconto_mercado_percentual || 10}% OFF</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-300">
                                      <span>Margem Real:</span>
                                      <span>
                                        {calc.cenarioB.valido
                                          ? `${calc.cenarioB.margemRealResultantePercent.toFixed(1)}%`
                                          : '-'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )
              })()}

              <Button
                type="button"
                variant="outline"
                onClick={handleAdicionarOpcaoVoo}
                className="w-full border-dashed border-sky-300 text-sky-800 hover:bg-sky-50 text-xs font-bold py-2.5"
              >
                <Plus className="w-4 h-4 mr-1.5 text-sky-600" /> + Adicionar Outra Opção de Voo
              </Button>
            </CardContent>
          </Card>

          {/* Card 4: Serviços Terrestres / Adicionais (Hotel, Transfer, Passeios) */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/60 pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-sky-800 font-bold text-xs">
                    4
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-800">
                      Serviços Adicionais & Terrestres
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Hotéis, transfers, passeios e seguros inclusos no pacote
                    </CardDescription>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAdicionarServico('hospedagem')}
                    className="h-7 text-xs bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                  >
                    <Hotel className="w-3 h-3 mr-1" /> + Hotel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAdicionarServico('traslado')}
                    className="h-7 text-xs bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                  >
                    <Car className="w-3 h-3 mr-1" /> + Transfer
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAdicionarServico('passeio')}
                    className="h-7 text-xs bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                  >
                    <Compass className="w-3 h-3 mr-1" /> + Tour
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAdicionarServico('seguro_viagem')}
                    className="h-7 text-xs bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100"
                  >
                    <ShieldCheck className="w-3 h-3 mr-1" /> + Seguro
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              {servicos.length === 0 ? (
                <div className="py-8 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2 bg-slate-50/40">
                  <p className="text-xs text-slate-500">
                    Nenhum serviço terrestre adicionado. Se a cotação incluir hotel ou passeios, use
                    os botões acima.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {servicos.map((servico, index) => (
                    <div
                      key={servico.id}
                      className="border border-slate-200 bg-white rounded-xl p-3.5 shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                          <Select
                            value={servico.categoria}
                            onValueChange={(val: ServicoCategoria) =>
                              handleAtualizarServico(servico.id, 'categoria', val)
                            }
                          >
                            <SelectTrigger className="h-7 text-xs font-bold w-44">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIAS_SERVICO.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoverServico(servico.id)}
                          className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-8 space-y-1">
                          <Label className="text-[10.5px] font-bold text-slate-600">
                            Título do Serviço
                          </Label>
                          <Input
                            placeholder="Ex: Hotel Hilton Orlando 5 noites / Transfer In-Out"
                            value={servico.nome}
                            onChange={(e) =>
                              handleAtualizarServico(servico.id, 'nome', e.target.value)
                            }
                            className="h-7 text-xs"
                          />
                        </div>

                        <div className="sm:col-span-4 space-y-1">
                          <Label className="text-[10.5px] font-bold text-slate-600">
                            Fornecedor
                          </Label>
                          <Input
                            placeholder="Ex: Bedsonline, Decolar"
                            value={servico.fornecedor || ''}
                            onChange={(e) =>
                              handleAtualizarServico(servico.id, 'fornecedor', e.target.value)
                            }
                            className="h-7 text-xs"
                          />
                        </div>

                        <div className="sm:col-span-12 space-y-1">
                          <Label className="text-[10.5px] font-bold text-slate-600">
                            Descrição / Detalhes (PDF)
                          </Label>
                          <Input
                            placeholder="Ex: Quarto Duplo com café da manhã incluso."
                            value={servico.descricao || ''}
                            onChange={(e) =>
                              handleAtualizarServico(servico.id, 'descricao', e.target.value)
                            }
                            className="h-7 text-xs text-slate-700"
                          />
                        </div>

                        <div className="sm:col-span-4 space-y-1">
                          <Label className="text-[10.5px] font-bold text-slate-600">Qtd</Label>
                          <Input
                            type="number"
                            min="1"
                            value={servico.quantidade}
                            onChange={(e) =>
                              handleAtualizarServico(
                                servico.id,
                                'quantidade',
                                parseInt(e.target.value, 10) || 1,
                              )
                            }
                            className="h-7 text-xs"
                          />
                        </div>

                        <div className="sm:col-span-4 space-y-1">
                          <Label className="text-[10.5px] font-bold text-slate-600">
                            Custo Unitário ({moeda})
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={servico.valor_unitario}
                            onChange={(e) =>
                              handleAtualizarServico(
                                servico.id,
                                'valor_unitario',
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="h-7 text-xs"
                          />
                        </div>

                        <div className="sm:col-span-4 space-y-1">
                          <Label className="text-[10.5px] font-bold text-slate-800">
                            Custo Total
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={servico.valor_custo_total}
                            onChange={(e) =>
                              handleAtualizarServico(
                                servico.id,
                                'valor_custo_total',
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="h-7 text-xs bg-slate-50 font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 5: Observações e Condições */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/60 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-sky-800 font-bold text-xs">
                  5
                </div>
                <CardTitle className="text-base font-bold text-slate-800">
                  Condições Comerciais & Pagamento
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="formasPagamento" className="text-xs font-bold text-slate-700">
                  Formas de Pagamento Sugeridas
                </Label>
                <Textarea
                  id="formasPagamento"
                  rows={2}
                  value={formasPagamento}
                  onChange={(e) => setFormasPagamento(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="observacoes" className="text-xs font-bold text-slate-700">
                  Observações Personalizadas da Proposta
                </Label>
                <Textarea
                  id="observacoes"
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="validadeDias" className="text-xs font-bold text-slate-700">
                    Validade da Cotação (Dias)
                  </Label>
                  <Input
                    id="validadeDias"
                    type="number"
                    min="1"
                    value={validadeDias}
                    onChange={(e) => setValidadeDias(parseInt(e.target.value, 10) || 7)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dataValidade" className="text-xs font-bold text-slate-700">
                    Data Limite de Validade
                  </Label>
                  <Input
                    id="dataValidade"
                    type="date"
                    value={dataValidade}
                    onChange={(e) => setDataValidade(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="condicoesGerais" className="text-xs font-bold text-slate-700">
                  Condições Gerais & Cancelamento
                </Label>
                <Textarea
                  id="condicoesGerais"
                  rows={3}
                  value={condicoesGerais}
                  onChange={(e) => setCondicoesGerais(e.target.value)}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Calculation Summary (Sticky on Desktop) */}
        <div className="space-y-6">
          <div className="sticky top-6 space-y-6">
            {/* Bloco Subtotal/Resumo por Opção de Voo */}
            <Card className="border-sky-200 bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-xl overflow-hidden">
              <div className="p-5 bg-sky-900/60 border-b border-sky-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-400" />
                  <h3 className="font-extrabold text-white text-base">Resumo das Opções</h3>
                </div>
                <Select value={moeda} onValueChange={(v: Moeda) => setMoeda(v)}>
                  <SelectTrigger className="w-24 h-7 text-xs bg-slate-800/80 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">BRL (R$)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <CardContent className="p-5 space-y-4 text-slate-200">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cada opção de voo é <strong>independente</strong>. Os preços não são somados entre
                  opções.
                </p>

                {/* Lista de Resumo de Cada Opção */}
                <div className="space-y-3">
                  {(() => {
                    const indiceMaisBarataSidebar = encontrarIndiceOpcaoMaisBarata(opcoesVoo)
                    return (
                      <>
                        {opcoesVoo.map((op, idx) => {
                          const c = calcularOpcaoVoo({
                            custo: op.custo,
                            margem_desejada: op.margem_desejada,
                            imposto_percentual: op.imposto_percentual,
                            preco_mercado: op.preco_mercado,
                            modo_precificacao: op.modo_precificacao,
                            desconto_mercado_percentual: op.desconto_mercado_percentual,
                          })

                          const valorPorPessoa = c.precoFinal / (numPassageiros || 1)
                          const isMaisBarata = indiceMaisBarataSidebar === idx

                          return (
                            <div
                              key={op.id || idx}
                              className="bg-slate-800/90 border border-slate-700 rounded-xl p-3.5 space-y-2"
                            >
                              <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/80">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono text-[10px] font-bold bg-slate-900 text-slate-300 px-1.5 py-0.5 rounded">
                                    #{idx + 1}
                                  </span>
                                  {isMaisBarata && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-600 text-white">
                                      Mais barata
                                    </span>
                                  )}
                                  <span className="text-xs font-bold text-white truncate max-w-[130px]">
                                    {op.companhia || `Opção #${idx + 1}`}
                                  </span>
                                </div>
                                <span className="text-xs text-slate-400 font-mono">
                                  {op.modo_precificacao === 'desconto_mercado'
                                    ? `${op.desconto_mercado_percentual || 10}% OFF`
                                    : `${op.margem_desejada}% marg`}
                                </span>
                              </div>

                              {op.observacao && op.observacao.trim() && (
                                <div className="text-[11px] text-amber-300/90 italic truncate">
                                  💬 {op.observacao.trim()}
                                </div>
                              )}

                              <div className="flex justify-between items-baseline pt-1">
                                <div>
                                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                                    Preço Final
                                  </span>
                                  <span className="text-lg font-black text-white">
                                    {formatarMoeda(c.precoFinal, moeda)}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-slate-400 block">
                                    Por adulto ({numPassageiros}x)
                                  </span>
                                  <span className="text-xs font-bold text-sky-300">
                                    {formatarMoeda(valorPorPessoa, moeda)}
                                  </span>
                                </div>
                              </div>

                              <div className="pt-1.5 border-t border-slate-700/60 flex justify-between text-[11px] text-emerald-400">
                                <span>Lucro Líquido Real:</span>
                                <span className="font-bold">
                                  + {formatarMoeda(c.lucroLiquido, moeda)} (
                                  {c.margemLiquidaPercent.toFixed(1)}
                                  %)
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </>
                    )
                  })()}
                </div>

                {/* Botões de Ação */}
                <div className="space-y-2 pt-3">
                  <Button
                    type="submit"
                    disabled={salvando}
                    className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold h-10 shadow-lg shadow-sky-900/40"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {salvando ? 'Salvando Cotação...' : 'Salvar Cotação'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevisualizar}
                    className="w-full border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold h-9"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5 text-sky-400" />
                    Visualizar Proposta / Imprimir PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de OCR de Print do Voo */}
      <ModalImportarPrint
        open={modalOcrAberto}
        onOpenChange={setModalOcrAberto}
        onConfirmar={handleAplicarDadosOcr}
      />
    </form>
  )
}
