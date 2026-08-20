import React, { useState, useRef } from 'react'
import { createWorker } from 'tesseract.js'
import { parseTextoVoo, DadosVooExtraidos } from '@/lib/ocrVoo'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  Plane,
  FileImage,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

interface ModalImportarPrintProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmar: (dados: Partial<DadosVooExtraidos>) => void
}

export function ModalImportarPrint({ open, onOpenChange, onConfirmar }: ModalImportarPrintProps) {
  const [fase, setFase] = useState<'upload' | 'processando' | 'revisao'>('upload')
  const [progresso, setProgresso] = useState<number>(0)
  const [statusTexto, setStatusTexto] = useState<string>('')
  const [imagemPreview, setImagemPreview] = useState<string | null>(null)
  const [textoReconhecido, setTextoReconhecido] = useState<string>('')

  // Campos em revisão
  const [dadosEditados, setDadosEditados] = useState<DadosVooExtraidos>({
    companhia: '',
    numero_voo: '',
    data_voo: '',
    horario_partida: '',
    horario_chegada: '',
    origem: '',
    destino: '',
    descricao: '',
  })

  const [confianca, setConfianca] = useState<Record<keyof DadosVooExtraidos, boolean>>({
    companhia: false,
    numero_voo: false,
    data_voo: false,
    horario_partida: false,
    horario_chegada: false,
    origem: false,
    destino: false,
    descricao: false,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetarEstado = () => {
    setFase('upload')
    setProgresso(0)
    setStatusTexto('')
    setImagemPreview(null)
    setTextoReconhecido('')
    setDadosEditados({
      companhia: '',
      numero_voo: '',
      data_voo: '',
      horario_partida: '',
      horario_chegada: '',
      origem: '',
      destino: '',
      descricao: '',
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await processarImagem(file)
  }

  const processarImagem = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido (PNG, JPEG, etc).')
      return
    }

    // Criar preview local
    const previewUrl = URL.createObjectURL(file)
    setImagemPreview(previewUrl)
    setFase('processando')
    setProgresso(5)
    setStatusTexto('Iniciando motor de OCR...')

    let timeoutId: ReturnType<typeof setTimeout> | null = null

    try {
      // Timeout de 30 segundos
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('TIMEOUT_OCR'))
        }, 30000)
      })

      const ocrPromise = (async () => {
        const worker = await createWorker(['por', 'eng'], 1, {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const p = Math.round((m.progress || 0) * 85) + 10
              setProgresso(p)
              setStatusTexto(`Analisando imagem... ${Math.min(95, p)}%`)
            } else if (
              m.status === 'loading tesseract core' ||
              m.status === 'initializing tesseract'
            ) {
              setStatusTexto('Carregando biblioteca de visão...')
              setProgresso(15)
            } else if (m.status === 'loading language traineddata') {
              setStatusTexto('Carregando dicionários (PT/EN)...')
              setProgresso(25)
            }
          },
        })

        const ret = await worker.recognize(file)
        await worker.terminate()
        return ret.data.text
      })()

      const text = await Promise.race([ocrPromise, timeoutPromise])
      if (timeoutId) clearTimeout(timeoutId)

      setTextoReconhecido(text || '')

      if (!text || text.trim().length < 5) {
        toast.warning(
          'Não foi possível ler o print. Tente uma imagem com melhor resolução ou preencha manualmente.',
        )
      }

      // Parser inteligente dos campos
      const { extraidos, confianca: conf } = parseTextoVoo(text || '')
      setDadosEditados(extraidos)
      setConfianca(conf)

      const totalAchados = Object.values(conf).filter(Boolean).length
      if (totalAchados === 0) {
        toast.info(
          'Nenhum campo de voo identificado com precisão. Você pode preencher os dados manualmente.',
        )
      } else {
        toast.success(`${totalAchados} campos identificados no print! Revise antes de confirmar.`)
      }

      setFase('revisao')
    } catch (err: unknown) {
      if (timeoutId) clearTimeout(timeoutId)
      console.error('Erro no OCR:', err)
      const isTimeout = (err as { message?: string })?.message === 'TIMEOUT_OCR'
      if (isTimeout) {
        toast.error(
          'O processamento da imagem excedeu 30 segundos. Tente uma imagem mais leve ou preencha manualmente.',
        )
      } else {
        toast.error('Não foi possível ler o print. Tente uma imagem com melhor resolução.')
      }
      setFase('upload')
    }
  }

  const handleConfirmarRevisao = () => {
    onConfirmar(dadosEditados)
    toast.success('Campos do voo preenchidos a partir do print!')
    onOpenChange(false)
    resetarEstado()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetarEstado()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-sky-800">
            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Importar Dados de Voo por Print (OCR)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Envie uma captura de tela do voo para preencher automaticamente os campos.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* FASE 1: UPLOAD */}
        {fase === 'upload' && (
          <div className="space-y-4 py-2">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/40 hover:bg-sky-50/80 transition rounded-xl p-8 text-center cursor-pointer space-y-3"
            >
              <div className="w-14 h-14 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Clique para selecionar ou arraste o print do voo
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Formatos aceitos: PNG, JPG, JPEG ou WebP (Prints de sites, Decolar, LATAM, Gol,
                  etc.)
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-white border-sky-300 text-sky-800 hover:bg-sky-50 text-xs font-semibold"
              >
                <FileImage className="w-3.5 h-3.5 mr-1.5" /> Escolher Imagem
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Dicas para melhor leitura:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500">
                <li>
                  Certifique-se de que a imagem mostre companhia, trecho, horários e número do voo.
                </li>
                <li>
                  Você terá a oportunidade de revisar e editar todos os campos antes de confirmar.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* FASE 2: PROCESSANDO */}
        {fase === 'processando' && (
          <div className="py-12 text-center space-y-4">
            <div className="w-14 h-14 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-2 max-w-sm mx-auto">
              <h4 className="font-bold text-slate-900 text-sm">{statusTexto}</h4>
              <Progress value={progresso} className="h-2 w-full" />
              <p className="text-xs text-slate-400">
                Extraindo informações textuais e identificando rotas aéreas...
              </p>
            </div>
          </div>
        )}

        {/* FASE 3: REVISÃO DOS CAMPOS */}
        {fase === 'revisao' && (
          <div className="space-y-4 py-1">
            <div className="flex items-center justify-between bg-sky-50 border border-sky-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">
                  Revise e ajuste os dados antes de preencher a opção
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFase('upload')}
                className="h-7 text-xs text-slate-600 hover:text-slate-900"
              >
                <RefreshCw className="w-3 h-3 mr-1" /> Trocar Print
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Companhia */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Companhia Aérea *</span>
                  {!confianca.companhia ? (
                    <span className="text-[10px] text-amber-600 flex items-center gap-0.5 font-medium">
                      <AlertTriangle className="w-3 h-3" /> Não detectado com certeza
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 flex items-center gap-0.5 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Identificado
                    </span>
                  )}
                </Label>
                <Input
                  placeholder="Ex: LATAM, Gol, Azul, American Airlines"
                  value={dadosEditados.companhia}
                  onChange={(e) =>
                    setDadosEditados({ ...dadosEditados, companhia: e.target.value })
                  }
                  className={`text-xs h-8 ${!confianca.companhia && !dadosEditados.companhia ? 'border-amber-400 bg-amber-50/30' : ''}`}
                />
              </div>

              {/* Número do Voo */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Nº do Voo</span>
                  {!confianca.numero_voo && (
                    <span className="text-[10px] text-amber-600 flex items-center gap-0.5 font-medium">
                      <AlertTriangle className="w-3 h-3" /> Opcional / Não lido
                    </span>
                  )}
                </Label>
                <Input
                  placeholder="Ex: LA8190, G3 1234, AA950"
                  value={dadosEditados.numero_voo}
                  onChange={(e) =>
                    setDadosEditados({ ...dadosEditados, numero_voo: e.target.value })
                  }
                  className={`text-xs h-8 ${!confianca.numero_voo && !dadosEditados.numero_voo ? 'border-amber-400 bg-amber-50/30' : ''}`}
                />
              </div>

              {/* Data do Voo */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Data do Voo</span>
                  {!confianca.data_voo && (
                    <span className="text-[10px] text-amber-600 flex items-center gap-0.5 font-medium">
                      <AlertTriangle className="w-3 h-3" /> Verifique a data
                    </span>
                  )}
                </Label>
                <Input
                  type="date"
                  value={dadosEditados.data_voo}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, data_voo: e.target.value })}
                  className={`text-xs h-8 ${!confianca.data_voo && !dadosEditados.data_voo ? 'border-amber-400 bg-amber-50/30' : ''}`}
                />
              </div>

              {/* Descrição Sintética */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Título / Descrição</Label>
                <Input
                  placeholder="Ex: LATAM • GRU → MCO • 15/06"
                  value={dadosEditados.descricao}
                  onChange={(e) =>
                    setDadosEditados({ ...dadosEditados, descricao: e.target.value })
                  }
                  className="text-xs h-8 font-medium"
                />
              </div>

              {/* Origem */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Origem (Aeroporto / Cidade) *</span>
                  {!confianca.origem && (
                    <span className="text-[10px] text-amber-600 flex items-center gap-0.5 font-medium">
                      <AlertTriangle className="w-3 h-3" /> Preencha a origem
                    </span>
                  )}
                </Label>
                <Input
                  placeholder="Ex: São Paulo (GRU)"
                  value={dadosEditados.origem}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, origem: e.target.value })}
                  className={`text-xs h-8 ${!confianca.origem && !dadosEditados.origem ? 'border-amber-400 bg-amber-50/30' : ''}`}
                />
              </div>

              {/* Destino */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Destino (Aeroporto / Cidade) *</span>
                  {!confianca.destino && (
                    <span className="text-[10px] text-amber-600 flex items-center gap-0.5 font-medium">
                      <AlertTriangle className="w-3 h-3" /> Preencha o destino
                    </span>
                  )}
                </Label>
                <Input
                  placeholder="Ex: Orlando (MCO)"
                  value={dadosEditados.destino}
                  onChange={(e) => setDadosEditados({ ...dadosEditados, destino: e.target.value })}
                  className={`text-xs h-8 ${!confianca.destino && !dadosEditados.destino ? 'border-amber-400 bg-amber-50/30' : ''}`}
                />
              </div>

              {/* Horário Partida */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Horário Partida</Label>
                <Input
                  placeholder="Ex: 08:30"
                  value={dadosEditados.horario_partida}
                  onChange={(e) =>
                    setDadosEditados({ ...dadosEditados, horario_partida: e.target.value })
                  }
                  className={`text-xs h-8 ${!confianca.horario_partida && !dadosEditados.horario_partida ? 'border-amber-400 bg-amber-50/30' : ''}`}
                />
              </div>

              {/* Horário Chegada */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Horário Chegada</Label>
                <Input
                  placeholder="Ex: 14:45 ou 06:15 (+1)"
                  value={dadosEditados.horario_chegada}
                  onChange={(e) =>
                    setDadosEditados({ ...dadosEditados, horario_chegada: e.target.value })
                  }
                  className={`text-xs h-8 ${!confianca.horario_chegada && !dadosEditados.horario_chegada ? 'border-amber-400 bg-amber-50/30' : ''}`}
                />
              </div>
            </div>

            {imagemPreview && (
              <details className="text-xs text-slate-500 border border-slate-200 rounded-lg p-2 bg-slate-50">
                <summary className="cursor-pointer font-semibold text-slate-700 select-none">
                  Ver Print Carregado & Texto Reconhecido
                </summary>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <img
                    src={imagemPreview}
                    alt="Print do voo"
                    className="max-h-40 object-contain rounded border border-slate-200 bg-white mx-auto"
                  />
                  <pre className="text-[10px] bg-white p-2 rounded border border-slate-200 max-h-40 overflow-y-auto whitespace-pre-wrap font-mono text-slate-600">
                    {textoReconhecido || 'Nenhum texto extraído.'}
                  </pre>
                </div>
              </details>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancelar
          </Button>

          {fase === 'revisao' && (
            <Button
              type="button"
              onClick={handleConfirmarRevisao}
              className="bg-sky-800 hover:bg-sky-900 text-white font-bold text-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Confirmar & Preencher Opção
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
