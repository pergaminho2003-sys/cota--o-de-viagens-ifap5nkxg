import React, { useState, useEffect, useMemo } from 'react'
import {
  Cotacao,
  ServicoItem,
  ServicoCategoria,
  CATEGORIAS_SERVICO,
  ConfiguracoesAgencia,
  StatusCotacao,
  Moeda,
  ModoPrecificacao,
} from '@/types/cotacao'
import {
  calcularTotaisCotacao,
  calcularCenarioModoA,
  calcularCenarioModoB,
  formatarMoeda,
} from '@/lib/calculos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  HelpCircle,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'

interface FormCotacaoProps {
  cotacaoInicial?: Cotacao | null
  configAgencia: ConfiguracoesAgencia
  onSalvar: (dados: Omit<Cotacao, 'id' | 'created' | 'updated'>, id?: string) => Promise<void>
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
  // Main form state
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

  // Services
  const [servicos, setServicos] = useState<ServicoItem[]>(cotacaoInicial?.servicos || [])

  // Pricing & Modes
  const [modoPrecificacao, setModoPrecificacao] = useState<ModoPrecificacao>(
    cotacaoInicial?.modo_precificacao || 'margem',
  )
  const [margemLucro, setMargemLucro] = useState<number>(
    cotacaoInicial?.margem_lucro !== undefined
      ? cotacaoInicial.margem_lucro
      : (configAgencia.margem_padrao ?? 15),
  )
  const [descontoMercadoPercentual, setDescontoMercadoPercentual] = useState<number>(
    cotacaoInicial?.desconto_mercado_percentual ?? 10,
  )
  const [precoMercado, setPrecoMercado] = useState<number | undefined>(
    cotacaoInicial?.preco_mercado !== undefined && cotacaoInicial.preco_mercado !== null
      ? cotacaoInicial.preco_mercado
      : undefined,
  )
  const [desconto, setDesconto] = useState<number>(cotacaoInicial?.desconto ?? 0)
  const [taxasAdicionais, setTaxasAdicionais] = useState<number>(
    cotacaoInicial?.taxas_adicionais ?? 0,
  )
  const [moeda, setMoeda] = useState<Moeda>(cotacaoInicial?.moeda || 'BRL')
  const [cotacaoMoeda, setCotacaoMoeda] = useState<number>(cotacaoInicial?.cotacao_moeda ?? 1)
  const [margemMinimaAceitavel, setMargemMinimaAceitavel] = useState<number>(
    cotacaoInicial?.margem_minima_aceitavel !== undefined &&
      cotacaoInicial.margem_minima_aceitavel !== null
      ? cotacaoInicial.margem_minima_aceitavel
      : 10,
  )

  // Terms & Conditions
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

  const impostoAliquota =
    configAgencia.imposto_lucro_padrao !== undefined ? configAgencia.imposto_lucro_padrao : 6

  // Calculation engine
  const totais = useMemo(() => {
    return calcularTotaisCotacao({
      servicos,
      modoPrecificacao,
      margemLucroPercent: margemLucro,
      descontoMercadoPercent: descontoMercadoPercentual,
      precoMercado,
      desconto,
      taxasAdicionais,
      numPassageiros,
      impostoLucroPercent: impostoAliquota,
    })
  }, [
    servicos,
    modoPrecificacao,
    margemLucro,
    descontoMercadoPercentual,
    precoMercado,
    desconto,
    taxasAdicionais,
    numPassageiros,
    impostoAliquota,
  ])

  // Comparações dos 2 cenários para decisão interna
  const cenarioA = useMemo(() => {
    return calcularCenarioModoA({
      custoTotal: totais.valorCustoTotal,
      margemPercent: margemLucro,
      impostoPercent: impostoAliquota,
      precoMercado,
    })
  }, [totais.valorCustoTotal, margemLucro, impostoAliquota, precoMercado])

  const cenarioB = useMemo(() => {
    return calcularCenarioModoB({
      custoTotal: totais.valorCustoTotal,
      precoMercado,
      descontoPercent: descontoMercadoPercentual,
      impostoPercent: impostoAliquota,
    })
  }, [totais.valorCustoTotal, precoMercado, descontoMercadoPercentual, impostoAliquota])

  // Set default validity date if not set
  useEffect(() => {
    if (!dataValidade && validadeDias) {
      const d = new Date()
      d.setDate(d.getDate() + validadeDias)
      setDataValidade(d.toISOString().split('T')[0])
    }
  }, [validadeDias, dataValidade])

  // Services Management
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

  const handleDuplicarServico = (index: number) => {
    const item = servicos[index]
    const duplicado: ServicoItem = {
      ...item,
      id: `srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nome: `${item.nome} (Cópia)`,
    }
    const novos = [...servicos]
    novos.splice(index + 1, 0, duplicado)
    setServicos(novos)
    toast.info('Item duplicado')
  }

  const handleAtualizarServico = (id: string, campo: keyof ServicoItem, valor: any) => {
    setServicos((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s

        const atualizado = { ...s, [campo]: valor }

        // Recalculate cost total if quantity or unit price changed
        if (campo === 'quantidade' || campo === 'valor_unitario') {
          const qtd = campo === 'quantidade' ? Number(valor) : s.quantidade || 1
          const unit = campo === 'valor_unitario' ? Number(valor) : s.valor_unitario || 0
          atualizado.valor_custo_total = qtd * unit
        }

        return atualizado
      }),
    )
  }

  const montarObjetoCotacao = (): Cotacao => {
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
      modo_precificacao: modoPrecificacao,
      margem_lucro: margemLucro,
      desconto_mercado_percentual:
        modoPrecificacao === 'desconto_mercado' ? descontoMercadoPercentual : undefined,
      desconto,
      taxas_adicionais: taxasAdicionais,
      moeda,
      cotacao_moeda: cotacaoMoeda,
      valor_custo_total: totais.valorCustoTotal,
      valor_lucro: totais.valorMargemLucro,
      valor_venda_total: totais.valorFinalVenda,
      preco_mercado:
        precoMercado !== undefined &&
        precoMercado !== null &&
        !isNaN(precoMercado) &&
        precoMercado > 0
          ? precoMercado
          : undefined,
      margem_minima_aceitavel: margemMinimaAceitavel,
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
    if (servicos.length === 0) {
      toast.error('Adicione pelo menos um serviço ou item à cotação')
      return false
    }
    if (modoPrecificacao === 'desconto_mercado') {
      if (!precoMercado || precoMercado <= 0) {
        toast.error(
          'No Modo B (Desconto de Mercado), o Preço de Mercado é obrigatório e deve ser maior que zero.',
        )
        return false
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
    if (modoPrecificacao === 'desconto_mercado' && (!precoMercado || precoMercado <= 0)) {
      toast.error(
        'No Modo B (Desconto de Mercado), informe o Preço de Mercado antes de visualizar a proposta.',
      )
      return
    }
    const cotacao = montarObjetoCotacao()
    onVisualizar(cotacao)
  }

  const getCategoriaIcon = (cat: ServicoCategoria) => {
    switch (cat) {
      case 'passagem_aerea':
        return <Plane className="w-4 h-4 text-sky-600" />
      case 'hospedagem':
        return <Hotel className="w-4 h-4 text-indigo-600" />
      case 'traslado':
        return <Car className="w-4 h-4 text-emerald-600" />
      case 'passeio':
        return <Compass className="w-4 h-4 text-amber-600" />
      case 'seguro_viagem':
        return <ShieldCheck className="w-4 h-4 text-teal-600" />
      case 'aluguel_carro':
        return <KeySquare className="w-4 h-4 text-blue-600" />
      case 'cruzeiro':
        return <Ship className="w-4 h-4 text-cyan-600" />
      case 'trem':
        return <Train className="w-4 h-4 text-purple-600" />
      case 'taxas_visto':
        return <FileText className="w-4 h-4 text-orange-600" />
      default:
        return <Package className="w-4 h-4 text-slate-600" />
    }
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
                : 'Nova Cotação de Viagem'}
            </h1>
            <p className="text-xs text-slate-500">
              Preencha os serviços, defina sua margem e gere a proposta para o cliente
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
                    placeholder="Ex: João da Silva / Família Oliveira"
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
                  Destino & Datas da Viagem
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
                    placeholder="Ex: Paris & Roma | Orlando (Disney) | Punta Cana All-Inclusive"
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
                    Data de Ida / Início
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
                    Data de Retorno / Fim
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

          {/* Card 3: Itens e Serviços da Cotação */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/60 pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-sky-800 font-bold text-xs">
                    3
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-800">
                      Serviços Inclusos & Precificação
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Insira os custos de cada serviço para cálculo automático da margem de lucro
                    </CardDescription>
                  </div>
                </div>

                {/* Quick Add Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAdicionarServico('passagem_aerea')}
                    className="h-7 text-xs bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100"
                  >
                    <Plane className="w-3 h-3 mr-1" /> + Aéreo
                  </Button>
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
                <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-3 bg-slate-50/40">
                  <div className="w-12 h-12 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center mx-auto">
                    <Plane className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Nenhum serviço adicionado ainda
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Clique nos botões rápidos acima ou no botão abaixo para adicionar passagens,
                    hotéis, passeios e seguros.
                  </p>
                  <Button
                    type="button"
                    onClick={() => handleAdicionarServico('passagem_aerea')}
                    className="bg-sky-800 hover:bg-sky-900 text-white text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Primeiro Serviço
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {servicos.map((servico, index) => (
                    <div
                      key={servico.id}
                      className="border border-slate-200 bg-white rounded-xl p-4 shadow-sm hover:border-sky-300 transition"
                    >
                      {/* Item Header */}
                      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                          <div className="flex items-center gap-1.5">
                            {getCategoriaIcon(servico.categoria)}
                            <Select
                              value={servico.categoria}
                              onValueChange={(val: ServicoCategoria) =>
                                handleAtualizarServico(servico.id, 'categoria', val)
                              }
                            >
                              <SelectTrigger className="h-7 text-xs font-bold w-48 border-none bg-slate-100 hover:bg-slate-200">
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
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicarServico(index)}
                            title="Duplicar Item"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoverServico(servico.id)}
                            title="Remover Item"
                            className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Item Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-7 space-y-1">
                          <Label className="text-[11px] font-bold text-slate-600">
                            Título do Serviço / Item *
                          </Label>
                          <Input
                            placeholder="Ex: Passagem LATAM GRU-MIA com bagagem / Hotel Hilton 4 noites"
                            value={servico.nome}
                            required
                            onChange={(e) =>
                              handleAtualizarServico(servico.id, 'nome', e.target.value)
                            }
                            className="h-8 text-xs font-semibold"
                          />
                        </div>

                        <div className="sm:col-span-5 space-y-1">
                          <Label className="text-[11px] font-bold text-slate-600">
                            Fornecedor / Operadora (Opcional)
                          </Label>
                          <Input
                            placeholder="Ex: CVC, Decolar, Air France, Bedsonline"
                            value={servico.fornecedor || ''}
                            onChange={(e) =>
                              handleAtualizarServico(servico.id, 'fornecedor', e.target.value)
                            }
                            className="h-8 text-xs text-slate-600"
                          />
                        </div>

                        <div className="sm:col-span-12 space-y-1">
                          <Label className="text-[11px] font-bold text-slate-600">
                            Descrição / Detalhes para o Cliente (Aparece na proposta)
                          </Label>
                          <Input
                            placeholder="Ex: Quarto Superior com vista, café da manhã incluso, transfers in/out com motorista."
                            value={servico.descricao || ''}
                            onChange={(e) =>
                              handleAtualizarServico(servico.id, 'descricao', e.target.value)
                            }
                            className="h-8 text-xs text-slate-700"
                          />
                        </div>

                        {/* Financial Inputs for this Service */}
                        <div className="sm:col-span-3 space-y-1">
                          <Label className="text-[11px] font-bold text-slate-600">Quantidade</Label>
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
                            className="h-8 text-xs"
                          />
                        </div>

                        <div className="sm:col-span-4 space-y-1">
                          <Label className="text-[11px] font-bold text-slate-600">
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
                            className="h-8 text-xs"
                          />
                        </div>

                        <div className="sm:col-span-5 space-y-1">
                          <Label className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                            <span>Subtotal Custo do Item</span>
                            <span className="text-sky-700 font-extrabold text-xs">
                              {formatarMoeda(servico.valor_custo_total, moeda)}
                            </span>
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
                            className="h-8 text-xs bg-slate-50 font-semibold text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAdicionarServico('outros')}
                    className="w-full border-dashed border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold py-2"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Outro Serviço
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 4: Observações e Condições */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/60 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-sky-800 font-bold text-xs">
                  4
                </div>
                <CardTitle className="text-base font-bold text-slate-800">
                  Condições Comerciais & Observações
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
                  placeholder="Ex: Entrada 20% PIX + 10x sem juros no cartão | 5% de desconto à vista via PIX"
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
                  placeholder="Ex: Cotação inclui bagagem de 23kg, taxas de embarque e hotel próximo à praia."
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
                  Condições Gerais & Políticas de Cancelamento
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
            {/* Card de Precificação & Margem */}
            <Card className="border-sky-200 bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-xl overflow-hidden">
              <div className="p-5 bg-sky-900/60 border-b border-sky-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-sky-400" />
                  <h3 className="font-extrabold text-white text-base">Precificação & Lucro</h3>
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

              <CardContent className="p-5 space-y-5 text-slate-200">
                {/* 1. SELETOR OBRIGATÓRIO DE MODO DE PRECIFICAÇÃO */}
                <div className="space-y-2 bg-slate-800/80 p-3.5 rounded-xl border border-sky-600/40 shadow-inner">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-sky-400" /> Modo de Precificação *
                    </Label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                      {modoPrecificacao === 'margem' ? 'Modo A' : 'Modo B'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setModoPrecificacao('margem')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        modoPrecificacao === 'margem'
                          ? 'bg-sky-900/90 border-sky-400 text-white shadow-md shadow-sky-950 ring-1 ring-sky-400'
                          : 'bg-slate-900/70 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            modoPrecificacao === 'margem' ? 'bg-sky-400' : 'bg-slate-600'
                          }`}
                        />
                        Margem Desejada
                      </div>
                      <p className="text-[10px] opacity-80 mt-1 leading-tight">
                        Custo × (1 + margem %)
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModoPrecificacao('desconto_mercado')}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        modoPrecificacao === 'desconto_mercado'
                          ? 'bg-amber-950/90 border-amber-400 text-white shadow-md shadow-amber-950 ring-1 ring-amber-400'
                          : 'bg-slate-900/70 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            modoPrecificacao === 'desconto_mercado'
                              ? 'bg-amber-400'
                              : 'bg-slate-600'
                          }`}
                        />
                        Desconto Mercado
                      </div>
                      <p className="text-[10px] opacity-80 mt-1 leading-tight">
                        Mercado × (1 − desconto %)
                      </p>
                    </button>
                  </div>
                </div>

                {/* 2. CAMPOS DO MODO SELECIONADO */}
                {modoPrecificacao === 'margem' ? (
                  /* MODO A: Margem Desejada */
                  <div className="space-y-2.5 bg-sky-950/40 p-3.5 rounded-xl border border-sky-700/60">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="margemLucro"
                        className="text-xs font-bold text-sky-300 flex items-center gap-1"
                      >
                        <Percent className="w-3.5 h-3.5 text-sky-400" /> Margem Desejada (%)
                      </Label>
                      <span className="text-sm font-black text-sky-400">{margemLucro}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        id="margemLucro"
                        type="number"
                        min="0"
                        step="0.5"
                        value={margemLucro}
                        onChange={(e) => setMargemLucro(parseFloat(e.target.value) || 0)}
                        className="bg-slate-900 border-slate-700 text-white text-sm font-bold h-9"
                      />
                      <span className="text-xs font-bold text-slate-400 px-1">%</span>
                    </div>

                    {/* Atalhos rápidos de margem */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Atalhos de margem desejada:
                      </span>
                      <div className="grid grid-cols-6 gap-1">
                        {[25, 30, 35, 40, 45, 50].map((opcao) => (
                          <Button
                            key={opcao}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setMargemLucro(opcao)}
                            className={`h-7 px-1 text-[11px] font-bold transition-all ${
                              margemLucro === opcao
                                ? 'bg-sky-600 text-white border-sky-400 shadow-sm hover:bg-sky-500'
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            {opcao}%
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Campo opcional de preço de mercado no Modo A (apenas para vantagem comercial) */}
                    <div className="pt-2 border-t border-sky-900/60 space-y-1">
                      <Label
                        htmlFor="precoMercadoModoA"
                        className="text-[11px] text-slate-400 font-medium flex items-center justify-between"
                      >
                        <span>Preço de Mercado ({moeda}) - Opcional</span>
                        <span className="text-[10px] text-sky-400">Só para mostrar economia</span>
                      </Label>
                      <Input
                        id="precoMercadoModoA"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ex: 5500.00"
                        value={precoMercado !== undefined ? precoMercado : ''}
                        onChange={(e) => {
                          const val = e.target.value
                          setPrecoMercado(val === '' ? undefined : parseFloat(val))
                        }}
                        className="bg-slate-900 border-slate-700 text-white text-xs h-8"
                      />
                      <span className="text-[10px] text-slate-500 block leading-tight">
                        No Modo A, o mercado NÃO altera o preço final, serve apenas para exibir
                        vantagem no PDF.
                      </span>
                    </div>
                  </div>
                ) : (
                  /* MODO B: Desconto sobre Preço de Mercado */
                  <div className="space-y-3 bg-amber-950/40 p-3.5 rounded-xl border border-amber-600/60">
                    <div className="space-y-1">
                      <Label
                        htmlFor="precoMercadoModoB"
                        className="text-xs font-bold text-amber-300 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Preço de Mercado (
                          {moeda}) *
                        </span>
                        <span className="text-[10px] bg-amber-900/80 text-amber-200 px-1.5 py-0.5 rounded border border-amber-700 font-semibold">
                          Obrigatório Modo B
                        </span>
                      </Label>
                      <Input
                        id="precoMercadoModoB"
                        type="number"
                        min="0"
                        step="0.01"
                        required={modoPrecificacao === 'desconto_mercado'}
                        placeholder="Ex: 6000.00"
                        value={precoMercado !== undefined ? precoMercado : ''}
                        onChange={(e) => {
                          const val = e.target.value
                          setPrecoMercado(val === '' ? undefined : parseFloat(val))
                        }}
                        className="bg-slate-900 border-amber-500/60 focus:border-amber-400 text-white text-sm font-bold h-9"
                      />
                      <span className="text-[10px] text-amber-300/80 block leading-tight">
                        Preço de referência do concorrente ou valor cheio de balcão.
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="descontoMercadoPercentual"
                          className="text-xs font-bold text-amber-300 flex items-center gap-1"
                        >
                          <Percent className="w-3.5 h-3.5 text-amber-400" /> Desconto % que vou dar
                          *
                        </Label>
                        <span className="text-sm font-black text-amber-400">
                          {descontoMercadoPercentual}% OFF
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          id="descontoMercadoPercentual"
                          type="number"
                          min="0"
                          max="90"
                          step="0.5"
                          value={descontoMercadoPercentual}
                          onChange={(e) =>
                            setDescontoMercadoPercentual(parseFloat(e.target.value) || 0)
                          }
                          className="bg-slate-900 border-amber-500/60 text-white text-sm font-bold h-9"
                        />
                        <span className="text-xs font-bold text-amber-400 px-1">%</span>
                      </div>

                      {/* Atalhos rápidos de desconto de mercado */}
                      <div className="grid grid-cols-5 gap-1 pt-1">
                        {[5, 8, 10, 12, 15].map((desc) => (
                          <Button
                            key={desc}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setDescontoMercadoPercentual(desc)}
                            className={`h-7 px-1 text-[11px] font-bold transition-all ${
                              descontoMercadoPercentual === desc
                                ? 'bg-amber-600 text-white border-amber-400 shadow-sm hover:bg-amber-500'
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            {desc}%
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Desconto adicional em R$ e Taxas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label
                      htmlFor="taxasAdicionais"
                      className="text-[11px] text-slate-400 font-semibold"
                    >
                      Taxas / Encargos (+)
                    </Label>
                    <Input
                      id="taxasAdicionais"
                      type="number"
                      min="0"
                      step="0.01"
                      value={taxasAdicionais}
                      onChange={(e) => setTaxasAdicionais(parseFloat(e.target.value) || 0)}
                      className="bg-slate-900 border-slate-700 text-white text-xs h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="desconto" className="text-[11px] text-slate-400 font-semibold">
                      Desconto Avulso R$ (-)
                    </Label>
                    <Input
                      id="desconto"
                      type="number"
                      min="0"
                      step="0.01"
                      value={desconto}
                      onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
                      className="bg-slate-900 border-slate-700 text-white text-xs h-8"
                    />
                  </div>
                </div>

                {/* 3. CARDS COMPARATIVOS LADO A LADO: MODO A vs MODO B (TELA DE DECISÃO INTERNA DO DONO) */}
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Decisão Interna (Modo A vs Modo B)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      Comparativo
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* CARD MODO A */}
                    <div
                      onClick={() => setModoPrecificacao('margem')}
                      className={`cursor-pointer rounded-xl p-3 space-y-2 border transition-all ${
                        modoPrecificacao === 'margem'
                          ? 'bg-sky-950/70 border-sky-400 ring-2 ring-sky-500/40 shadow-md'
                          : 'bg-slate-950/40 border-slate-800 opacity-60 hover:opacity-90 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              modoPrecificacao === 'margem'
                                ? 'bg-sky-400 animate-pulse'
                                : 'bg-slate-600'
                            }`}
                          />
                          <span className="font-bold text-xs text-white">Modo A: Margem</span>
                        </div>
                        {modoPrecificacao === 'margem' && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-sky-500 text-white px-1.5 py-0.5 rounded">
                            Ativo
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="text-[11px]">Preço Final:</span>
                          <span className="font-extrabold text-white text-sm">
                            {formatarMoeda(cenarioA.precoFinal, moeda)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-400 text-[11px]">
                          <span>Margem Desejada:</span>
                          <span className="font-bold">{cenarioA.margemRealPercent}%</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-300 text-[11px]">
                          <span>Lucro Líq. ({impostoAliquota}% imp):</span>
                          <span className="font-semibold">
                            {formatarMoeda(cenarioA.lucroLiquido, moeda)} (
                            {cenarioA.margemLiquidaPercent.toFixed(1)}%)
                          </span>
                        </div>
                        {cenarioA.temEconomia && (
                          <div className="pt-1 border-t border-slate-800/80 flex justify-between text-[10px] text-sky-300">
                            <span>Economia p/ cliente:</span>
                            <span className="font-bold">
                              {formatarMoeda(cenarioA.economiaClienteReais, moeda)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CARD MODO B */}
                    <div
                      onClick={() => setModoPrecificacao('desconto_mercado')}
                      className={`cursor-pointer rounded-xl p-3 space-y-2 border transition-all ${
                        modoPrecificacao === 'desconto_mercado'
                          ? 'bg-amber-950/70 border-amber-400 ring-2 ring-amber-500/40 shadow-md'
                          : 'bg-slate-950/40 border-slate-800 opacity-60 hover:opacity-90 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              modoPrecificacao === 'desconto_mercado'
                                ? 'bg-amber-400 animate-pulse'
                                : 'bg-slate-600'
                            }`}
                          />
                          <span className="font-bold text-xs text-white">Modo B: Desconto</span>
                        </div>
                        {modoPrecificacao === 'desconto_mercado' && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded">
                            Ativo
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="text-[11px]">Preço Final:</span>
                          <span className="font-extrabold text-white text-sm">
                            {cenarioB.valido
                              ? formatarMoeda(cenarioB.precoFinal, moeda)
                              : 'Informe mercado'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-amber-300 text-[11px]">
                          <span>Desconto Dado:</span>
                          <span className="font-bold">{descontoMercadoPercentual}% OFF</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-300 text-[11px]">
                          <span>Margem Real Resultante:</span>
                          <span className="font-extrabold text-emerald-400">
                            {cenarioB.valido
                              ? `${cenarioB.margemRealResultantePercent.toFixed(1)}%`
                              : '-'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400 text-[10px]">
                          <span>Lucro Líq. ({impostoAliquota}% imp):</span>
                          <span>
                            {cenarioB.valido ? formatarMoeda(cenarioB.lucroLiquido, moeda) : '-'}
                          </span>
                        </div>
                        {cenarioB.valido && (
                          <div className="pt-1 border-t border-slate-800/80 flex justify-between text-[10px] text-amber-300">
                            <span>Economia no PDF:</span>
                            <span className="font-bold">
                              {formatarMoeda(cenarioB.economiaClienteReais, moeda)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. RESUMO FINANCEIRO FINAL DA PROPOSTA */}
                <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal (Custo dos Serviços):</span>
                    <span className="font-semibold text-slate-100">
                      {formatarMoeda(totais.valorCustoTotal, moeda)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Modo Efetivo de Venda:</span>
                    <span className="font-medium text-sky-400">
                      {modoPrecificacao === 'margem'
                        ? `Modo A (Margem ${margemLucro}%)`
                        : `Modo B (Desconto ${descontoMercadoPercentual}% sobre Mercado)`}
                    </span>
                  </div>

                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Lucro Bruto Estimado:</span>
                    <span className="font-bold">
                      + {formatarMoeda(totais.valorMargemLucro, moeda)}
                    </span>
                  </div>

                  <div className="flex justify-between text-rose-300/90 text-xs">
                    <span>Imposto ({totais.aliquotaImpostoLucro}% sobre o lucro):</span>
                    <span className="font-semibold">
                      - {formatarMoeda(totais.valorImpostoLucro, moeda)}
                    </span>
                  </div>

                  <div className="flex justify-between text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1.5 rounded-md font-semibold">
                    <span className="text-emerald-300 flex items-center gap-1 font-bold">
                      Lucro Líquido Real:
                    </span>
                    <span className="font-extrabold text-emerald-200">
                      {formatarMoeda(totais.valorLucroLiquido, moeda)} (
                      {totais.margemLiquidaEfetivaPercent.toFixed(1)}% líq.)
                    </span>
                  </div>

                  {taxasAdicionais > 0 && (
                    <div className="flex justify-between text-slate-300 pt-1">
                      <span>Taxas Adicionais:</span>
                      <span className="text-slate-100 font-medium">
                        + {formatarMoeda(taxasAdicionais, moeda)}
                      </span>
                    </div>
                  )}

                  {desconto > 0 && (
                    <div className="flex justify-between text-amber-400 pt-1">
                      <span>Desconto Avulso:</span>
                      <span className="font-medium">- {formatarMoeda(desconto, moeda)}</span>
                    </div>
                  )}

                  {/* Total Final da Proposta */}
                  <div className="pt-3 mt-3 border-t-2 border-sky-500/50 bg-sky-950/40 p-3 rounded-lg flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-extrabold tracking-wider text-sky-300">
                        Total da Proposta (PDF)
                      </span>
                      <span className="text-xl font-black text-white">
                        {formatarMoeda(totais.valorFinalVenda, moeda)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-sky-900/60 mt-1">
                      <span>Por passageiro adulto ({numPassageiros}x):</span>
                      <span className="font-bold text-sky-300">
                        {formatarMoeda(totais.valorPorPessoa, moeda)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="space-y-2 pt-2">
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

            {/* Dica rápida de vendas */}
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 text-xs text-sky-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-sky-950">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>Dica de Agente</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Após salvar ou visualizar a proposta, você poderá baixar o PDF comercial ou enviar o
                resumo diretamente ao cliente pelo WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
