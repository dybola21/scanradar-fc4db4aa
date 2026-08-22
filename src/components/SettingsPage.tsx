import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getIntegrationSettings, updateIntegrationSettings, testIntegration } from "@/lib/scraper.functions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, Activity, Copy, Check, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui-kit/PageHeader";
import { cn } from "@/lib/utils";

export default function Settings() {
  const queryClient = useQueryClient();
  const fetchSettings = useServerFn(getIntegrationSettings);
  const updateSettingsFn = useServerFn(updateIntegrationSettings);
  const testFn = useServerFn(testIntegration);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["n8n-settings"],
    queryFn: () => fetchSettings(),
  });

  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [integrationName, setIntegrationName] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (settings) {
      setWebhookUrl(settings.webhook_url);
      setWebhookSecret("");
      setIntegrationName(settings.integration_name);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: { webhook_url: string; webhook_secret?: string | null; integration_name: string }) =>
      updateSettingsFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["n8n-settings"] });
      queryClient.invalidateQueries({ queryKey: ["integration-status"] });
      toast.success("Configurações salvas.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      webhook_url: webhookUrl.trim(),
      webhook_secret: webhookSecret || null,
      integration_name: integrationName.trim() || "n8n integration",
    });
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const result = await testFn();
      if (result.success) {
        toast.success("Conexão com o n8n confirmada.");
        queryClient.invalidateQueries({ queryKey: ["n8n-settings"] });
        queryClient.invalidateQueries({ queryKey: ["integration-status"] });
      } else {
        toast.error(result.error ?? "Falha no teste de conexão.");
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsTesting(false);
    }
  };

  const copyUrl = async () => {
    if (!webhookUrl) return;
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success("URL copiada.");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  const connected = Boolean(settings?.is_connected);
  const configured = Boolean(settings?.webhook_url);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Configurações"
        title="Integração n8n"
        description="Conecte o webhook responsável por executar as extrações de leads."
      />

      <div
        className={cn(
          "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border p-4",
          !configured
            ? "border-border bg-card"
            : connected
              ? "border-success/30 bg-success-soft"
              : "border-warning/30 bg-warning-soft",
        )}
      >
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            !configured ? "bg-secondary text-muted-foreground" : connected ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
          )}
        >
          <Activity className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {!configured ? "Nenhum webhook configurado" : connected ? "Integração conectada" : "Integração aguardando teste"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {!configured
              ? "Preencha a URL do webhook para habilitar as buscas."
              : connected
                ? `${settings?.integration_name} está pronta para processar extrações.`
                : "Salve as configurações e execute o teste de conexão."}
          </p>
        </div>
        <Button
          variant="outline"
          className="min-h-11 shrink-0 rounded-xl"
          onClick={handleTest}
          disabled={isTesting || !webhookUrl}
        >
          {isTesting ? <Loader2 className="size-4 animate-spin" /> : <Activity className="size-4" />}
          Testar
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-5 rounded-2xl border border-border bg-card p-5 md:p-6">
        <div className="space-y-2">
          <Label htmlFor="integration-name" className="text-sm font-medium">
            Nome da integração
          </Label>
          <Input
            id="integration-name"
            value={integrationName}
            onChange={(e) => setIntegrationName(e.target.value)}
            placeholder="Ex.: ScanRadar produção"
            className="h-11 rounded-xl"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhook-url" className="text-sm font-medium">
            URL do webhook
          </Label>
          <div className="flex gap-2">
            <Input
              id="webhook-url"
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://n8n.seudominio.com/webhook/scanradar"
              className="h-11 min-w-0 flex-1 rounded-xl"
              required
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={copyUrl}
              className="size-11 shrink-0 rounded-xl"
              aria-label="Copiar URL do webhook"
              disabled={!webhookUrl}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Endpoint POST do nó Webhook no seu fluxo n8n.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhook-secret" className="text-sm font-medium">
            Chave de segurança
          </Label>
          <Input
            id="webhook-secret"
            type="password"
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
            placeholder={settings?.has_secret ? "Chave salva — preencha para substituir" : "Token enviado em X-Webhook-Secret"}
            className="h-11 rounded-xl"
          />
          <p className="text-xs text-muted-foreground">
            Enviada no cabeçalho <code>X-Webhook-Secret</code> para validar a origem da requisição.
          </p>
        </div>

          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 shrink-0" />
              A chave fica armazenada com criptografia AES-256 no servidor.
            </p>
            <Button 
              onClick={handleSave} 
              className="min-h-11 rounded-xl px-6" 
              disabled={updateMutation.isPending || !webhookUrl || (webhookUrl === settings?.webhook_url && !webhookSecret)}
            >
              {updateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Salvar configurações
            </Button>
          </div>
        </div>
    </div>
  );
}
