import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSearchDetails } from "@/lib/scraper.functions";
import { useParams, Link } from "@tanstack/react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Download,
  ExternalLink,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Search,
  AlertCircle,
  Copy,
  X,
} from "lucide-react";
import { exportToCSV, exportToExcel } from "@/lib/export-utils";
import { toast } from "sonner";
import { classifyWebsiteUrl } from "@/lib/website-utils";
import { PageHeader } from "@/components/ui-kit/PageHeader";
import { EmptyState } from "@/components/ui-kit/EmptyState";
import { PresenceBadge, SearchStatusBadge } from "@/components/ui-kit/Badges";
import { StatCard } from "@/components/ui-kit/StatCard";
import { opportunityScore, PRESENCE_LABEL, PRESENCE_ORDER } from "@/lib/lead-insights";
import { Target, Users, Globe, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ResultsPage() {
  const { searchId } = useParams({ from: "/_authenticated/results/$searchId" });
  const fetchDetails = useServerFn(getSearchDetails);

  const [presenceFilter, setPresenceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("opportunity");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["search-details", searchId],
    queryFn: () => fetchDetails({ data: { searchId } }),
    refetchInterval: (q) => (q.state.data?.search.status === "processing" ? 4000 : false),
  });

  const search = data?.search;
  const leads = data?.leads ?? [];

  const classified = useMemo(
    () => leads.map((lead) => ({ ...lead, classification: classifyWebsiteUrl(lead.website) })),
    [leads],
  );

  const stats = useMemo(() => {
    const total = classified.length;
    return {
      total,
      noOwn: classified.filter((l) => l.classification.hasOwnWebsite === false).length,
      withOwn: classified.filter((l) => l.classification.hasOwnWebsite === true).length,
      indeterminate: classified.filter((l) => l.classification.hasOwnWebsite === null).length,
    };
  }, [classified]);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    const rows = classified.filter((lead) => {
      const matchesText =
        !text ||
        (lead.nome ?? "").toLowerCase().includes(text) ||
        (lead.cidade ?? "").toLowerCase().includes(text) ||
        (lead.telefone ?? "").toLowerCase().includes(text);
      const matchesPresence =
        presenceFilter === "all" ||
        (presenceFilter === "no_own_site" && lead.classification.hasOwnWebsite === false) ||
        (presenceFilter === "with_own_site" && lead.classification.hasOwnWebsite === true) ||
        lead.classification.type === presenceFilter;
      return matchesText && matchesPresence;
    });

    return rows.sort((a, b) => {
      if (sortBy === "opportunity") {
        return opportunityScore(a.classification.type) - opportunityScore(b.classification.type);
      }
      if (sortBy === "name") return (a.nome ?? "").localeCompare(b.nome ?? "");
      if (sortBy === "contact") {
        const score = (l: typeof a) => (l.telefone ? 2 : 0) + (l.email || l.email2 ? 1 : 0);
        return score(b) - score(a);
      }
      return 0;
    });
  }, [classified, presenceFilter, sortBy, query]);

  const selectedLeads = filtered.filter((lead) => selected.has(lead.id));
  const allVisibleSelected = filtered.length > 0 && filtered.every((lead) => selected.has(lead.id));

  const toggleAll = () => {
    setSelected((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        filtered.forEach((lead) => next.delete(lead.id));
        return next;
      }
      return new Set([...prev, ...filtered.map((lead) => lead.id)]);
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportRows = selectedLeads.length ? selectedLeads : filtered;
  const fileBase = search ? `leads-${search.termo}-${search.cidade}` : "leads";

  const handleExportCSV = () => {
    if (!exportRows.length) return;
    exportToCSV(exportRows, `${fileBase}.csv`);
    toast.success(`${exportRows.length} leads exportados em CSV.`);
  };

  const handleExportExcel = () => {
    if (!exportRows.length) return;
    exportToExcel(exportRows, `${fileBase}.xlsx`);
    toast.success(`${exportRows.length} leads exportados em Excel.`);
  };

  const copyContacts = async () => {
    const rows = selectedLeads.length ? selectedLeads : filtered;
    const text = rows
      .map((l) => [l.nome, l.telefone, l.email || l.email2].filter(Boolean).join(" | "))
      .join("\n");
    await navigator.clipboard.writeText(text);
    toast.success(`${rows.length} contatos copiados.`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (!search) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Busca não encontrada"
        description="Ela pode ter sido removida ou pertence a outra conta."
        action={
          <Button asChild className="min-h-11 rounded-xl">
            <Link to="/history">Voltar ao histórico</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="size-10 shrink-0 rounded-xl" aria-label="Voltar ao histórico">
          <Link to="/history">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <PageHeader
          className="min-w-0 flex-1"
          eyebrow={`${search.cidade} · ${search.uf} · ${new Date(search.created_at).toLocaleDateString("pt-BR")}`}
          title={search.termo}
          actions={
            <>
              <SearchStatusBadge status={search.status} />
              <Button variant="outline" className="min-h-11 rounded-xl" onClick={handleExportCSV} disabled={!exportRows.length}>
                <Download className="size-4" />
                CSV
              </Button>
              <Button variant="outline" className="min-h-11 rounded-xl" onClick={handleExportExcel} disabled={!exportRows.length}>
                <Download className="size-4" />
                Excel
              </Button>
              {search.sheet_url ? (
                <Button asChild className="min-h-11 rounded-xl">
                  <a href={search.sheet_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4" />
                    Planilha
                  </a>
                </Button>
              ) : null}
            </>
          }
        />
      </div>

      <section aria-label="Resumo do resultado" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Leads extraídos" value={stats.total} icon={Users} />
        <StatCard
          label="Sem site próprio"
          value={stats.noOwn}
          hint={stats.total ? `${Math.round((stats.noOwn / stats.total) * 100)}% da lista` : undefined}
          icon={Target}
          tone="opportunity"
        />
        <StatCard label="Com site próprio" value={stats.withOwn} icon={Globe} tone="positive" />
        <StatCard label="Inconclusivos" value={stats.indeterminate} icon={HelpCircle} />
      </section>

      <div className="grid gap-3 lg:flex lg:items-center lg:justify-between">
        <div className="relative min-w-0 lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar empresa, cidade ou telefone"
            aria-label="Buscar leads"
            className="h-11 rounded-xl pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="min-w-0 space-y-1">
            <label htmlFor="presence-filter" className="text-xs font-medium text-muted-foreground">
              Presença digital
            </label>
            <Select value={presenceFilter} onValueChange={setPresenceFilter}>
              <SelectTrigger id="presence-filter" className="h-11 w-56 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Todos os leads</SelectItem>
                <SelectItem value="no_own_site">Sem site próprio</SelectItem>
                <SelectItem value="with_own_site">Com site próprio</SelectItem>
                {PRESENCE_ORDER.map((type) => (
                  <SelectItem key={type} value={type}>
                    {PRESENCE_LABEL[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-1">
            <label htmlFor="sort-by" className="text-xs font-medium text-muted-foreground">
              Ordenar por
            </label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger id="sort-by" className="h-11 w-52 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="opportunity">Potencial comercial</SelectItem>
                <SelectItem value="contact">Contatos disponíveis</SelectItem>
                <SelectItem value="name">Nome da empresa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {selected.size > 0 ? (
        <div className="sticky top-2 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-md">
          <p className="min-w-0 truncate text-sm font-medium">{selected.size} leads selecionados</p>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" size="sm" className="min-h-9 rounded-lg" onClick={copyContacts}>
              <Copy className="size-3.5" />
              Copiar contatos
            </Button>
            <Button variant="outline" size="sm" className="min-h-9 rounded-lg" onClick={handleExportCSV}>
              <Download className="size-3.5" />
              Exportar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="min-h-9 rounded-lg"
              onClick={() => setSelected(new Set())}
            >
              <X className="size-3.5" />
              Limpar
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Nenhum lead com esses filtros"
            description="Ajuste a busca textual ou o filtro de presença digital."
            action={
              <Button
                variant="outline"
                className="min-h-11 rounded-xl"
                onClick={() => {
                  setQuery("");
                  setPresenceFilter("all");
                }}
              >
                Limpar filtros
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10 px-4">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Selecionar todos os leads visíveis"
                    />
                  </TableHead>
                  <TableHead className="px-4 text-xs font-medium text-muted-foreground">Empresa</TableHead>
                  <TableHead className="px-4 text-xs font-medium text-muted-foreground">Contato</TableHead>
                  <TableHead className="px-4 text-xs font-medium text-muted-foreground">Presença digital</TableHead>
                  <TableHead className="px-4 text-right text-xs font-medium text-muted-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lead) => (
                  <TableRow key={lead.id} className={cn(selected.has(lead.id) && "bg-secondary/60")}>
                    <TableCell className="px-4 py-3">
                      <Checkbox
                        checked={selected.has(lead.id)}
                        onCheckedChange={() => toggleOne(lead.id)}
                        aria-label={`Selecionar ${lead.nome ?? "lead"}`}
                      />
                    </TableCell>
                    <TableCell className="max-w-[260px] px-4 py-3">
                      <p className="truncate text-sm font-medium text-foreground">{lead.nome ?? "Sem nome"}</p>
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <MapPin className="size-3 shrink-0" />
                        {[lead.bairro, lead.cidade, lead.uf].filter(Boolean).join(", ") || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-[240px] px-4 py-3">
                      <div className="space-y-0.5 text-sm">
                        {lead.telefone ? (
                          <a
                            href={`tel:${lead.telefone.replace(/\D/g, "")}`}
                            className="flex items-center gap-1.5 text-foreground hover:underline"
                          >
                            <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                            {lead.telefone}
                          </a>
                        ) : null}
                        {lead.email || lead.email2 ? (
                          <a
                            href={`mailto:${lead.email || lead.email2}`}
                            className="flex items-center gap-1.5 truncate text-xs text-muted-foreground hover:underline"
                          >
                            <Mail className="size-3.5 shrink-0" />
                            <span className="truncate">{lead.email || lead.email2}</span>
                          </a>
                        ) : null}
                        {!lead.telefone && !lead.email && !lead.email2 ? (
                          <span className="text-xs text-muted-foreground">Sem contato</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <PresenceBadge type={lead.classification.type} label={lead.classification.label} />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {lead.telefone ? (
                          <Button asChild variant="outline" size="sm" className="min-h-9 rounded-lg">
                            <a
                              href={`https://wa.me/55${lead.telefone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              WhatsApp
                            </a>
                          </Button>
                        ) : null}
                        {lead.classification.normalizedUrl ? (
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="size-9 rounded-lg"
                            aria-label={`Abrir link de ${lead.nome ?? "lead"}`}
                          >
                            <a href={lead.classification.normalizedUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="size-4" />
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Mostrando {filtered.length} de {stats.total} leads.
      </p>
    </div>
  );
}
