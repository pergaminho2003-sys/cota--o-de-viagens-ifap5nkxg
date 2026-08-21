import React, { useState, useEffect, useMemo } from 'react'
import {
  Cotacao,
  ConfiguracoesAgencia,
  StatusCotacao,
  STATUS_COTACAO_CONFIG,
} from '@/types/cotacao'
import { cotacoesService, configAgenciaService } from '@/services/cotacoesService'
import { FormCotacao } from '@/components/FormCotacao'
import { VisualizacaoCotacao } from '@/components/VisualizacaoCotacao'
import { DialogConfigAgencia } from '@/components/DialogConfigAgencia'
import { imprimirOuSalvarPDF } from '@/lib/geradorDocumento'
import { formatarMoeda, formatarData } from '@/lib/calculos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plane,
  Plus,
  Search,
  Settings,
  Eye,
  Edit,
  Trash2,
  Copy,
  Printer,
  TrendingUp,
  Briefcase,
  Users,
  DollarSign,
  Calendar,
  Sparkles,
  MapPin,
  CheckCircle2,
  Clock,
  Filter,
  FileSpreadsheet,
  ArrowUpDown,
  Compass,
} from 'lucide-react'
import { toast } from 'sonner'

export default function Index() {
  // Navigation / View State: 'lista' | 'nova' | 'editar' | 'visualizar'
  const [viewState, setViewState] = useState<'lista' | 'nova' | 'editar' | 'visualizar'>('lista')

  // Data State
  const [cotacoes, setCotacoes] = useState<Cotacao[]>([])
  const [cotacaoSelecionada, setCotacaoSelecionada] = useState<Cotacao | null>(null)
  const [configAgencia, setConfigAgencia] = useState<ConfiguracoesAgencia>({
    nome_agencia: 'Aura Viagens & Turismo',
    cnpj_cadastur: 'CADASTUR: 26.045.892/0001-30',
    email_contato: 'atendimento@auraviagens.com.br',
    margem_padrao: 15,
    imposto_lucro_padrao: 6,
    validade_padrao_dias: 7,
  })

  // Modals & Loaders
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [dialogConfigOpen, setDialogConfigOpen] = useState(false)
  const [dialogExcluirOpen, setDialogExcluirOpen] = useState(false)
  const [cotacaoParaExcluir, setCotacaoParaExcluir] = useState<Cotacao | null>(null)

  // Filters & Search
  const [termoBusca, setTermoBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [ordenacao, setOrdenacao] = useState<
    'recentes' | 'antigas' | 'maior_valor' | 'menor_valor'
  >('recentes')

  useEffect(() => {
    carregarDadosIniciais()
  }, [])

  const carregarDadosIniciais = async () => {
    setLoading(true)
    try {
      const [listaCotacoes, cfg] = await Promise.all([
        cotacoesService.listar(),
        configAgenciaService.obter(),
      ])
      setCotacoes(listaCotacoes)
      setConfigAgencia(cfg)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      toast.error('Erro ao conectar com o banco de dados.')
    } finally {
      setLoading(false)
    }
  }

  // Dashboard Metrics
  const metricas = useMemo(() => {
    const total = cotacoes.length
    const aprovadas = cotacoes.filter((c) => c.status === 'aprovada' || c.status === 'finalizada')
    const enviadas = cotacoes.filter((c) => c.status === 'enviada')

    const volumeTotal = cotacoes.reduce((acc, c) => acc + (c.valor_venda_total || 0), 0)
    const volumeFechado = aprovadas.reduce((acc, c) => acc + (c.valor_venda_total || 0), 0)
    const lucroPrevisto = cotacoes.reduce((acc, c) => acc + (c.valor_lucro || 0), 0)
    const lucroFechado = aprovadas.reduce((acc, c) => acc + (c.valor_lucro || 0), 0)

    const taxaConversao = total > 0 ? Math.round((aprovadas.length / total) * 100) : 0

    return {
      total,
      enviadasCount: enviadas.length,
      aprovadasCount: aprovadas.length,
      volumeTotal,
      volumeFechado,
      lucroPrevisto,
      lucroFechado,
      taxaConversao,
    }
  }, [cotacoes])

  // Filtered & Sorted Quotes
  const cotacoesFiltradas = useMemo(() => {
    return cotacoes
      .filter((c) => {
        const busca = termoBusca.toLowerCase().trim()
        const matchBusca =
          !busca ||
          c.cliente_nome.toLowerCase().includes(busca) ||
          c.destino.toLowerCase().includes(busca) ||
          c.codigo.toLowerCase().includes(busca) ||
          (c.cliente_email && c.cliente_email.toLowerCase().includes(busca))

        const matchStatus = filtroStatus === 'todos' || c.status === filtroStatus

        return matchBusca && matchStatus
      })
      .sort((a, b) => {
        if (ordenacao === 'recentes') {
          return new Date(b.created || '').getTime() - new Date(a.created || '').getTime()
        }
        if (ordenacao === 'antigas') {
          return new Date(a.created || '').getTime() - new Date(b.created || '').getTime()
        }
        if (ordenacao === 'maior_valor') {
          return (b.valor_venda_total || 0) - (a.valor_venda_total || 0)
        }
        if (ordenacao === 'menor_valor') {
          return (a.valor_venda_total || 0) - (b.valor_venda_total || 0)
        }
        return 0
      })
  }, [cotacoes, termoBusca, filtroStatus, ordenacao])

  // Actions
  const handleNovaCotacao = async () => {
    const proximoCodigo = await cotacoesService.gerarProximoCodigo()
    setCotacaoSelecionada({
      codigo: proximoCodigo,
      cliente_nome: '',
      destino: '',
      num_passageiros: 2,
      num_criancas: 0,
      status: 'rascunho',
      servicos: [],
      modo_precificacao: 'margem',
      margem_lucro:
        configAgencia.margem_padrao !== undefined && configAgencia.margem_padrao !== null
          ? configAgencia.margem_padrao
          : 15,
      desconto_mercado_percentual: 10,
      desconto: 0,
      taxas_adicionais: 0,
      moeda: 'BRL',
      cotacao_moeda: 1,
      valor_custo_total: 0,
      valor_lucro: 0,
      valor_venda_total: 0,
      preco_mercado: undefined,
      margem_minima_aceitavel: 10,
      validade_dias: configAgencia.validade_padrao_dias || 7,
      condicoes_gerais: configAgencia.condicoes_padrao || '',
      formas_pagamento: configAgencia.formas_pagamento_padrao || '',
    })
    setViewState('nova')
  }

  const handleEditarCotacao = (cotacao: Cotacao) => {
    setCotacaoSelecionada(cotacao)
    setViewState('editar')
  }

  const handleVisualizarCotacao = (cotacao: Cotacao) => {
    setCotacaoSelecionada(cotacao)
    setViewState('visualizar')
  }

  const handleDuplicarCotacao = async (cotacao: Cotacao) => {
    try {
      const proximoCodigo = await cotacoesService.gerarProximoCodigo()
      const copia: Omit<Cotacao, 'id' | 'created' | 'updated'> = {
        ...cotacao,
        codigo: proximoCodigo,
        cliente_nome: `${cotacao.cliente_nome} (Cópia)`,
        status: 'rascunho',
      }
      const criada = await cotacoesService.criar(copia)
      setCotacoes([criada, ...cotacoes])
      toast.success(`Cotação duplicada com sucesso como #${criada.codigo}`)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao duplicar cotação')
    }
  }

  const handleConfirmarExclusao = async () => {
    if (!cotacaoParaExcluir?.id) return
    try {
      await cotacoesService.excluir(cotacaoParaExcluir.id)
      setCotacoes(cotacoes.filter((c) => c.id !== cotacaoParaExcluir.id))
      toast.success('Cotação excluída com sucesso')
      setDialogExcluirOpen(false)
      setCotacaoParaExcluir(null)
      if (viewState !== 'lista') {
        setViewState('lista')
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir cotação')
    }
  }

  const handleSalvarCotacao = async (
    dados: Omit<Cotacao, 'id' | 'created' | 'updated'>,
    id?: string,
  ) => {
    setSalvando(true)
    try {
      if (id) {
        const atualizada = await cotacoesService.atualizar(id, dados)
        setCotacoes(cotacoes.map((c) => (c.id === id ? atualizada : c)))
        toast.success('Cotação atualizada com sucesso!')
        setCotacaoSelecionada(atualizada)
        setViewState('visualizar')
      } else {
        const nova = await cotacoesService.criar(dados)
        setCotacoes([nova, ...cotacoes])
        toast.success('Cotação criada com sucesso!')
        setCotacaoSelecionada(nova)
        setViewState('visualizar')
      }
    } catch (err) {
      console.error('Erro ao salvar cotação:', err)
      toast.error('Erro ao salvar cotação no servidor')
    } finally {
      setSalvando(false)
    }
  }

  const handleMudarStatusRapido = async (cotacao: Cotacao, novoStatus: StatusCotacao) => {
    if (!cotacao.id) return
    try {
      const atualizada = await cotacoesService.atualizar(cotacao.id, { status: novoStatus })
      setCotacoes(cotacoes.map((c) => (c.id === cotacao.id ? atualizada : c)))
      toast.success(`Status alterado para ${STATUS_COTACAO_CONFIG[novoStatus].label}`)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao alterar status')
    }
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setViewState('lista')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-sky-700 flex items-center justify-center text-white font-black text-xl shadow-inner group-hover:scale-105 transition">
              ✈
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  {configAgencia.nome_agencia || 'Sistema de Cotação'}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                  Agência
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Gerador & Precificador de Propostas Comerciais
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogConfigOpen(true)}
              className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-xs"
            >
              <Settings className="w-4 h-4 mr-1.5 text-sky-400" />
              Configurar Agência
            </Button>

            {viewState === 'lista' ? (
              <Button
                size="sm"
                onClick={handleNovaCotacao}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-950"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Nova Cotação
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewState('lista')}
                className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs"
              >
                Ver Todas as Cotações
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* VIEW: NOVA OU EDITAR COTAÇÃO */}
        {(viewState === 'nova' || viewState === 'editar') && (
          <FormCotacao
            cotacaoInicial={cotacaoSelecionada}
            configAgencia={configAgencia}
            onSalvar={handleSalvarCotacao}
            onCancelar={() => setViewState('lista')}
            onVisualizar={(c) => {
              setCotacaoSelecionada(c)
              setViewState('visualizar')
            }}
            salvando={salvando}
          />
        )}

        {/* VIEW: VISUALIZAR COTAÇÃO / GERAR PDF */}
        {viewState === 'visualizar' && cotacaoSelecionada && (
          <VisualizacaoCotacao
            cotacao={cotacaoSelecionada}
            configAgencia={configAgencia}
            onVoltar={() => setViewState('lista')}
            onEditar={handleEditarCotacao}
          />
        )}

        {/* VIEW: LISTA DE COTAÇÕES & DASHBOARD */}
        {viewState === 'lista' && (
          <div className="space-y-8">
            {/* Header com Boas-Vindas e Botão Principal */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Painel de Cotações & Propostas
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Gerencie orçamentos, acompanhe margens de lucro e emita PDFs comerciais
                  profissionais.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleNovaCotacao}
                  className="bg-sky-800 hover:bg-sky-900 text-white font-bold px-5 h-10 shadow-md flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Criar Nova Cotação
                </Button>
              </div>
            </div>

            {/* Metrics Dashboard Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-slate-200 shadow-sm bg-white hover:border-sky-300 transition">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Cotações Totais
                    </p>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">{metricas.total}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {metricas.enviadasCount} enviadas em negociação
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm bg-white hover:border-sky-300 transition">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Volume em Cotações
                    </p>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">
                      {formatarMoeda(metricas.volumeTotal)}
                    </h3>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                      Fechado: {formatarMoeda(metricas.volumeFechado)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm bg-white hover:border-sky-300 transition">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Lucro Estimado
                    </p>
                    <h3 className="text-2xl font-black text-emerald-700 mt-1">
                      {formatarMoeda(metricas.lucroPrevisto)}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Lucro fechado: {formatarMoeda(metricas.lucroFechado)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm bg-white hover:border-sky-300 transition">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Taxa de Fechamento
                    </p>
                    <h3 className="text-2xl font-black text-sky-800 mt-1">
                      {metricas.taxaConversao}%
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {metricas.aprovadasCount} viagens aprovadas
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter and Search Bar */}
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  {/* Search input */}
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <Input
                      placeholder="Buscar por cliente, destino, código ou e-mail..."
                      value={termoBusca}
                      onChange={(e) => setTermoBusca(e.target.value)}
                      className="pl-9 h-10 text-xs sm:text-sm"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v)}>
                      <SelectTrigger className="w-full sm:w-44 h-10 text-xs font-semibold">
                        <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os Status</SelectItem>
                        <SelectItem value="rascunho">Rascunhos</SelectItem>
                        <SelectItem value="enviada">Enviadas</SelectItem>
                        <SelectItem value="aprovada">Aprovadas</SelectItem>
                        <SelectItem value="recusada">Não Fechadas</SelectItem>
                        <SelectItem value="finalizada">Finalizadas</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Order selector */}
                    <Select value={ordenacao} onValueChange={(v: any) => setOrdenacao(v)}>
                      <SelectTrigger className="w-full sm:w-44 h-10 text-xs font-semibold">
                        <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                        <SelectValue placeholder="Ordenar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recentes">Mais Recentes</SelectItem>
                        <SelectItem value="antigas">Mais Antigas</SelectItem>
                        <SelectItem value="maior_valor">Maior Valor</SelectItem>
                        <SelectItem value="menor_valor">Menor Valor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* List of Quotes */}
            {loading ? (
              <div className="py-20 text-center space-y-3 bg-white rounded-xl border border-slate-200">
                <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-500 font-medium">Carregando cotações salvas...</p>
              </div>
            ) : cotacoesFiltradas.length === 0 ? (
              <div className="py-16 text-center space-y-4 bg-white rounded-xl border border-dashed border-slate-300 p-6">
                <div className="w-16 h-16 bg-sky-50 text-sky-700 rounded-full flex items-center justify-center mx-auto">
                  <Compass className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800">Nenhuma cotação encontrada</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {termoBusca || filtroStatus !== 'todos'
                      ? 'Nenhuma proposta corresponde aos filtros selecionados. Tente limpar a busca.'
                      : 'Comece criando a primeira cotação de viagem para seu cliente!'}
                  </p>
                </div>
                {termoBusca || filtroStatus !== 'todos' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTermoBusca('')
                      setFiltroStatus('todos')
                    }}
                  >
                    Limpar Filtros
                  </Button>
                ) : (
                  <Button
                    onClick={handleNovaCotacao}
                    className="bg-sky-800 hover:bg-sky-900 text-white font-bold text-xs"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Criar Cotação Agora
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {cotacoesFiltradas.map((cotacao) => {
                  const statusConf =
                    STATUS_COTACAO_CONFIG[cotacao.status] || STATUS_COTACAO_CONFIG.rascunho
                  const servicosCount = cotacao.servicos?.length || 0

                  return (
                    <div
                      key={cotacao.id || cotacao.codigo}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:border-sky-300 hover:shadow-md transition p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      {/* Left Info */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">
                            {cotacao.codigo}
                          </span>

                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusConf.badgeClass}`}
                          >
                            {statusConf.label}
                          </span>

                          <span className="text-xs text-slate-400">
                            • Criada em {formatarData(cotacao.created || new Date().toISOString())}
                          </span>
                        </div>

                        <div>
                          <h3
                            className="text-lg font-black text-slate-900 hover:text-sky-800 transition cursor-pointer"
                            onClick={() => handleVisualizarCotacao(cotacao)}
                          >
                            {cotacao.destino}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
                            <span className="font-bold text-slate-800 flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-sky-700" />
                              {cotacao.cliente_nome}
                            </span>
                            {cotacao.cliente_telefone && (
                              <span className="text-slate-500">{cotacao.cliente_telefone}</span>
                            )}
                            {(cotacao.data_ida || cotacao.data_volta) && (
                              <span className="flex items-center gap-1 text-slate-500">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {formatarData(cotacao.data_ida)} até{' '}
                                {formatarData(cotacao.data_volta)}
                              </span>
                            )}
                            <span className="text-slate-400">
                              {servicosCount} {servicosCount === 1 ? 'serviço' : 'serviços'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Financial Info */}
                      <div className="flex flex-row lg:flex-col justify-between lg:justify-center items-start lg:items-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 lg:min-w-[210px]">
                        <div className="text-left lg:text-right">
                          <div className="flex items-center gap-1 lg:justify-end">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                              Total da Proposta
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {cotacao.modo_precificacao === 'desconto_mercado'
                                ? 'Modo B (Desc. Mercado)'
                                : 'Modo A (Margem)'}
                            </span>
                          </div>
                          <span className="text-xl font-black text-slate-950 block">
                            {formatarMoeda(cotacao.valor_venda_total, cotacao.moeda)}
                          </span>
                        </div>
                        <div className="text-right text-[11px] text-emerald-700 font-semibold mt-0.5">
                          {cotacao.modo_precificacao === 'desconto_mercado' ? (
                            <span>
                              {cotacao.desconto_mercado_percentual || 0}% OFF mercado (+
                              {formatarMoeda(cotacao.valor_lucro, cotacao.moeda)})
                            </span>
                          ) : (
                            <span>
                              Margem: {cotacao.margem_lucro}% (+
                              {formatarMoeda(cotacao.valor_lucro, cotacao.moeda)})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                        {/* Status Quick Dropdown */}
                        <Select
                          value={cotacao.status}
                          onValueChange={(val: StatusCotacao) =>
                            handleMudarStatusRapido(cotacao, val)
                          }
                        >
                          <SelectTrigger className="h-8 text-xs w-28 bg-slate-50 border-slate-200">
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

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleVisualizarCotacao(cotacao)}
                          title="Visualizar Proposta / PDF"
                          className="h-8 px-2.5 text-xs text-sky-800 bg-sky-50/50 hover:bg-sky-100 border-sky-200"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Ver
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditarCotacao(cotacao)}
                          title="Editar Cotação"
                          className="h-8 px-2.5 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1 text-slate-500" />
                          Editar
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicarCotacao(cotacao)}
                          title="Duplicar Cotação"
                          className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => imprimirOuSalvarPDF(cotacao, configAgencia)}
                          title="Imprimir / PDF Direto"
                          className="h-8 w-8 p-0 text-slate-500 hover:text-sky-700"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCotacaoParaExcluir(cotacao)
                            setDialogExcluirOpen(true)
                          }}
                          title="Excluir Cotação"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Dialog: Configurações da Agência */}
      <DialogConfigAgencia
        open={dialogConfigOpen}
        onOpenChange={setDialogConfigOpen}
        onSaved={(cfg) => setConfigAgencia(cfg)}
      />

      {/* Dialog: Confirmar Exclusão */}
      <Dialog open={dialogExcluirOpen} onOpenChange={setDialogExcluirOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a cotação{' '}
              <strong>
                #{cotacaoParaExcluir?.codigo} - {cotacaoParaExcluir?.destino}
              </strong>
              ? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogExcluirOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmarExclusao}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Excluir Definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
