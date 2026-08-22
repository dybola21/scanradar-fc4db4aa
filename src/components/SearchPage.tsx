import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { startSearch, getSearchHistory, getIntegrationStatus } from "@/lib/scraper.functions";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Search, Loader2, ChevronDown, AlertTriangle, RotateCcw, Info } from "lucide-react";
import { PageHeader } from "@/components/ui-kit/PageHeader";
import { cn } from "@/lib/utils";

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export default function SearchPage() {
  const navigate = useNavigate();
  const startSearchFn = useServerFn(startSearch);
  const fetchHistory = useServerFn(getSearchHistory);
  const fetchStatus = useServerFn(getIntegrationStatus);

  const [termo, setTermo] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [errors, setErrors] = useState<{ termo?: string; cidade?: string; uf?: string }>({});

  const { data: integration } = useQuery({ queryKey: ["integration-status"], queryFn: () => fetchStatus() });
  const { data: history } = useQuery({ queryKey: ["search-history"], queryFn: () => fetchHistory() });
  const lastSearch = history?.[0];

  const searchMutation = useMutation({
    mutationFn: (data: { termo: string; cidade: string; uf: string }) => startSearchFn({ data }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Busca iniciada com sucesso.");
        navigate({ to: "/results/$searchId", params: { searchId: result.searchId } });
      } else {
        toast.error(result.error ?? "O n8n retornou um erro inesperado.");
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const validate = () => {
    const next: typeof errors = {};
    const t = termo.trim();
    const c = cidade.trim();
    
    if (t.length < 2) next.termo = "Informe o nicho ou tipo de empresa.";
    if (c.length < 2) next.cidade = "Informe a cidade.";
    if (!uf) next.uf = "Selecione o estado.";
    
    setErrors(next);
    
    if (Object.keys(next).length > 0) {
      toast.error("Preencha nicho, cidade e estado.");
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    if (!validate()) return;
    
    searchMutation.mutate({ 
      termo: termo.trim(), 
      cidade: cidade.trim(), 
      uf: uf.toUpperCase() 
    });
  };

  const repeatLast = () => {
    if (!lastSearch) return;
    setTermo(lastSearch.termo);
    setCidade(lastSearch.cidade);
    setUf(lastSearch.uf);
    setErrors({});
  };

  const isPending = searchMutation.isPending;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Prospecção"
        title="Nova busca de empresas"
        description="Defina nicho e localização. Os leads são classificados por presença digital ao final."
        actions={
          lastSearch ? (
            <Button variant="outline" onClick={repeatLast} className="min-h-11 rounded-xl">
              <RotateCcw className="size-4" />
              Repetir última
            </Button>
          ) : null
        }
      />

      {integration && !integration.configured ? (
        <Alert className="rounded-2xl border-warning/30 bg-warning-soft">
          <AlertTriangle className="size-4 text-warning" />
          <AlertTitle>Integração n8n necessária</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>Você precisa configurar o webhook do n8n antes de realizar qualquer busca no Google Maps.</p>
            <Button asChild variant="outline" size="sm" className="h-9 rounded-lg border-warning/20 bg-warning/10 text-warning hover:bg-warning/20">
              <Link to="/settings">Ir para Configurações</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_140px]">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="termo" className="text-sm font-medium">
              Nicho ou tipo de empresa
            </Label>
            <Input
              id="termo"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Ex.: restaurantes, clínicas odontológicas, oficinas"
              aria-invalid={Boolean(errors.termo)}
              aria-describedby={errors.termo ? "termo-error" : "termo-hint"}
              className="h-11 rounded-xl"
            />
            {errors.termo ? (
              <p id="termo-error" className="text-xs text-destructive">
                {errors.termo}
              </p>
            ) : (
              <p id="termo-hint" className="text-xs text-muted-foreground">
                Use o termo como um cliente buscaria no Google Maps.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cidade" className="text-sm font-medium">
              Cidade
            </Label>
            <Input
              id="cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Ex.: Campinas"
              aria-invalid={Boolean(errors.cidade)}
              aria-describedby={errors.cidade ? "cidade-error" : undefined}
              className="h-11 rounded-xl"
            />
            {errors.cidade ? (
              <p id="cidade-error" className="text-xs text-destructive">
                {errors.cidade}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="uf" className="text-sm font-medium">
              Estado
            </Label>
            <Select value={uf} onValueChange={(value) => setUf(value)}>
              <SelectTrigger
                id="uf"
                aria-invalid={Boolean(errors.uf)}
                className={cn("h-11 rounded-xl", errors.uf && "border-destructive")}
              >
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {ESTADOS.map((estado) => (
                  <SelectItem key={estado} value={estado} className="rounded-lg">
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.uf ? <p className="text-xs text-destructive">{errors.uf}</p> : null}
          </div>
        </div>

        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="mt-5">
          <CollapsibleTrigger className="flex min-h-11 w-full items-center justify-between rounded-xl border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            Detalhes da extração
            <ChevronDown className={cn("size-4 transition-transform", advancedOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <ul className="space-y-2 rounded-xl bg-secondary/60 p-4 text-sm text-muted-foreground">
              <li>Profundidade completa: a engine varre todos os registros disponíveis para o termo.</li>
              <li>Enriquecimento de e-mails e links a partir do site ou perfil encontrado.</li>
              <li>Classificação automática de presença digital (sem site, WhatsApp, Instagram, plataforma).</li>
            </ul>
          </CollapsibleContent>
        </Collapsible>

        <div className="mt-5 grid gap-3 sm:flex sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="size-3.5 shrink-0" />
            A extração pode levar alguns minutos, dependendo do volume.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 rounded-xl"
              onClick={() => {
                setTermo("");
                setCidade("");
                setUf("");
                setErrors({});
              }}
              disabled={isPending}
            >
              Limpar
            </Button>
            <Button 
              type="submit" 
              className="min-h-11 rounded-xl px-6" 
              disabled={isPending || !integration?.configured}
            >
              {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Search className="mr-2 size-4" />}
              {isPending ? "Iniciando…" : "Iniciar busca"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
