import React, { useState, useEffect } from 'react'
import { ConfiguracoesAgencia } from '@/types/cotacao'
import { configAgenciaService } from '@/services/cotacoesService'
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Building2, Image as ImageIcon, Sparkles, Loader2, Upload, Trash2 } from 'lucide-react'

interface DialogConfigAgenciaProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (config: ConfiguracoesAgencia) => void
}

export function DialogConfigAgencia({ open, onOpenChange, onSaved }: DialogConfigAgenciaProps) {
  const [loading, setLoading] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [arquivoLogo, setArquivoLogo] = useState<File | null | undefined>(undefined)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [config, setConfig] = useState<ConfiguracoesAgencia>({
    nome_agencia: 'Aura Viagens & Turismo',
    cnpj_cadastur: '',
    email_contato: '',
    telefone_contato: '',
    whatsapp: '',
    endereco: '',
    site_instagram: '',
    logo: '',
    logo_url: '',
    margem_padrao: 15,
    imposto_lucro_padrao: 6,
    validade_padrao_dias: 7,
    condicoes_padrao: '',
    formas_pagamento_padrao: '',
    mensagem_agradecimento: '',
  })

  useEffect(() => {
    if (open) {
      carregarConfiguracoes()
    }
  }, [open])

  const carregarConfiguracoes = async () => {
    setLoading(true)
    try {
      const dados = await configAgenciaService.obter()
      setConfig(dados)
      setArquivoLogo(undefined)
      setPreviewUrl(dados.logo_url || '')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar dados da agência')
    } finally {
      setLoading(false)
    }
  }

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      const atualizado = await configAgenciaService.salvar(config, arquivoLogo)
      toast.success('Configurações da agência salvas com sucesso!')
      onSaved?.(atualizado)
      onOpenChange(false)
    } catch (err: unknown) {
      console.error('Erro ao salvar configurações:', err)
      const errorObj = err as { data?: Record<string, { message?: string }>; message?: string }
      let detalhe = ''
      if (errorObj?.data) {
        detalhe = Object.entries(errorObj.data)
          .map(([k, v]) => `${k}: ${v?.message || JSON.stringify(v)}`)
          .join(', ')
      }
      toast.error(
        detalhe ? `Erro ao salvar: ${detalhe}` : 'Erro ao salvar configurações da agência',
      )
    } finally {
      setSalvando(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB')
      return
    }

    setArquivoLogo(file)
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
    toast.success('Logo selecionada para envio')
  }

  const handleRemoverLogo = () => {
    setArquivoLogo(null)
    setPreviewUrl('')
    setConfig((prev) => ({ ...prev, logo: '', logo_url: '' }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-navy-800">
            <Building2 className="w-5 h-5 text-sky-600" />
            <DialogTitle className="text-xl font-bold text-slate-900">
              Configurações da Agência
            </DialogTitle>
          </div>
          <DialogDescription>
            Personalize os dados, logotipo e termos padrões que aparecerão nos documentos e PDFs das
            cotações.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-2" />
            <p className="text-sm">Carregando dados da agência...</p>
          </div>
        ) : (
          <form onSubmit={handleSalvar} className="space-y-6 py-2">
            {/* Logo da Agência */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <Label className="text-sm font-semibold text-slate-800 block mb-2">
                Logotipo da Agência
              </Label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-16 rounded-md border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden p-1">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Logo Agência"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-slate-300 hover:bg-slate-100 transition shadow-sm text-slate-700">
                      <Upload className="w-3.5 h-3.5" />
                      Enviar Logo (PNG/JPG)
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </label>
                    {previewUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoverLogo}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Remover
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Recomendado: imagem retangular com fundo transparente ou branco (máx 5MB).
                  </p>
                </div>
              </div>
            </div>

            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nome_agencia">Nome da Agência *</Label>
                <Input
                  id="nome_agencia"
                  required
                  value={config.nome_agencia}
                  onChange={(e) => setConfig({ ...config, nome_agencia: e.target.value })}
                  placeholder="Ex: Aura Viagens & Turismo"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cnpj_cadastur">CNPJ / CADASTUR</Label>
                <Input
                  id="cnpj_cadastur"
                  value={config.cnpj_cadastur || ''}
                  onChange={(e) => setConfig({ ...config, cnpj_cadastur: e.target.value })}
                  placeholder="Ex: CADASTUR 26.045.892/0001-30"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email_contato">E-mail de Contato</Label>
                <Input
                  id="email_contato"
                  type="email"
                  value={config.email_contato || ''}
                  onChange={(e) => setConfig({ ...config, email_contato: e.target.value })}
                  placeholder="contato@suaagencia.com.br"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telefone_contato">Telefone / WhatsApp</Label>
                <Input
                  id="telefone_contato"
                  value={config.telefone_contato || ''}
                  onChange={(e) => setConfig({ ...config, telefone_contato: e.target.value })}
                  placeholder="(11) 98765-4321"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="endereco">Endereço Comercial</Label>
                <Input
                  id="endereco"
                  value={config.endereco || ''}
                  onChange={(e) => setConfig({ ...config, endereco: e.target.value })}
                  placeholder="Av. Exemplo, 1000, Sala 50 - Cidade, UF"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="site_instagram">Site e Redes Sociais</Label>
                <Input
                  id="site_instagram"
                  value={config.site_instagram || ''}
                  onChange={(e) => setConfig({ ...config, site_instagram: e.target.value })}
                  placeholder="@suaagencia | www.suaagencia.com.br"
                />
              </div>
            </div>

            {/* Padrões Comerciais */}
            <div className="p-4 bg-sky-50/60 rounded-lg border border-sky-100 space-y-4">
              <div className="flex items-center gap-1.5 text-sky-900 font-semibold text-sm">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>Padrões Automáticos para Novas Cotações</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="margem_padrao">Margem de Lucro Padrão (%)</Label>
                  <div className="relative">
                    <Input
                      id="margem_padrao"
                      type="number"
                      min="0"
                      step="0.5"
                      value={
                        config.margem_padrao !== undefined &&
                        config.margem_padrao !== null &&
                        !isNaN(config.margem_padrao)
                          ? config.margem_padrao
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value
                        setConfig({
                          ...config,
                          margem_padrao: val === '' ? 0 : parseFloat(val) || 0,
                        })
                      }}
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                      %
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="imposto_lucro_padrao">Imposto s/ Lucro (%)</Label>
                  <div className="relative">
                    <Input
                      id="imposto_lucro_padrao"
                      type="number"
                      min="0"
                      step="0.1"
                      value={config.imposto_lucro_padrao ?? 6}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          imposto_lucro_padrao:
                            parseFloat(e.target.value) >= 0 ? parseFloat(e.target.value) : 0,
                        })
                      }
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                      %
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="validade_padrao_dias">Validade Padrão (Dias)</Label>
                  <Input
                    id="validade_padrao_dias"
                    type="number"
                    min="1"
                    value={config.validade_padrao_dias || 7}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        validade_padrao_dias: parseInt(e.target.value, 10) || 7,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="formas_pagamento_padrao">Texto Padrão de Formas de Pagamento</Label>
                <Textarea
                  id="formas_pagamento_padrao"
                  rows={2}
                  value={config.formas_pagamento_padrao || ''}
                  onChange={(e) =>
                    setConfig({ ...config, formas_pagamento_padrao: e.target.value })
                  }
                  placeholder="Ex: Entrada 20% + 10x sem juros no cartão..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="condicoes_padrao">Termos e Condições Gerais Padrão</Label>
                <Textarea
                  id="condicoes_padrao"
                  rows={3}
                  value={config.condicoes_padrao || ''}
                  onChange={(e) => setConfig({ ...config, condicoes_padrao: e.target.value })}
                  placeholder="Ex: Valores sujeitos a disponibilidade..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mensagem_agradecimento">Mensagem de Rodapé / Agradecimento</Label>
                <Input
                  id="mensagem_agradecimento"
                  value={config.mensagem_agradecimento || ''}
                  onChange={(e) => setConfig({ ...config, mensagem_agradecimento: e.target.value })}
                  placeholder="Agradecemos a preferência!"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvando}
                className="bg-sky-700 hover:bg-sky-800 text-white"
              >
                {salvando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
