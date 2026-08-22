import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardStats } from "@/lib/scraper.functions";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Target, Mail, Search, Phone, ArrowRight, Radar, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/ui-kit/PageHeader";
import { StatCard } from "@/components/ui-kit/StatCard";
import { EmptyState } from "@/components/ui-kit/EmptyState";
import { PresenceBadge, SearchStatusBadge } from "@/components/ui-kit/Badges";
import { PERIOD_OPTIONS, type PeriodValue, type PresenceType } from "@/lib/lead-insights";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [period, setPeriod] = useState<PeriodValue>("30");
  const fetchStats = useServerFn(getDashboardStats);

  const days = period === "all" ? 0 : (Number(period) as 7 | 30 | 90);
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", period],
    queryFn: () => fetchStats({ data: { days } }),
  });

  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label.toLowerCase() ?? "";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Visão geral"
        title="Dashboard de prospecção"
        description={`Métricas consolidadas dos últimos ${periodLabel}.`}
        actions={
          <>
            <div
              role="group"
              aria-label="Selecionar período"
              className="flex items-center gap-1 rounded-xl border border-border bg-card p-1"
            >
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPeriod(option.value)}
                  aria-pressed={period === option.value}
                  className={cn(
                    "min-h-9 rounded-lg px-3 text-xs font-medium transition-colors",
                    period === option.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Button asChild className="min-h-11 rounded-xl px-5">
              <Link to="/search">
                <Search className="size-4" />
                Nova busca
              </Link>
            </Button>
          </>
        }
      />

      <section aria-label="Indicadores principais" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Leads capturados"
          value={stats?.totalLeads ?? 0}
          hint={`${stats?.leadsToday ?? 0} hoje`}
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard
          label="Oportunidades sem site"
          value={stats?.leadsWithoutWebsite ?? 0}
          hint={`${stats?.opportunityRate ?? 0}% da base do período`}
          icon={Target}
          tone="opportunity"
          isLoading={isLoading}
        />
        <StatCard
          label="Leads com contato"
          value={stats?.leadsWithPhone ?? 0}
          hint={`${stats?.leadsWithEmail ?? 0} com e-mail`}
          icon={Mail}
          tone="positive"
          isLoading={isLoading}
        />
        <StatCard
          label="Buscas realizadas"
          value={stats?.totalSearches ?? 0}
          hint={`${stats?.runningSearches ?? 0} em execução · ${stats?.failedSearches ?? 0} com falha`}
          icon={Radar}
          isLoading={isLoading}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section
          aria-label="Oportunidades prioritárias"
          className="rounded-2xl border border-border bg-card lg:col-span-2"
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-foreground">Oportunidades prioritárias</h2>
              <p className="text-xs text-muted-foreground">Empresas sem site próprio, ordenadas por potencial.</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0 rounded-lg">
              <Link to="/history">
                Ver buscas
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : stats?.priorityOpportunities.length ? (
            <ul className="divide-y divide-border">
              {stats.priorityOpportunities.map((lead) => (
                <li key={lead.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium text-foreground">{lead.nome ?? "Sem nome"}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">
                        {[lead.cidade, lead.uf].filter(Boolean).join(" · ") || "Localização não informada"}
                      </span>
                      <PresenceBadge type={lead.presenceType as PresenceType} label={lead.presenceLabel} />
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {lead.telefone ? (
                      <Button asChild variant="outline" size="sm" className="min-h-9 rounded-lg">
                        <a href={`tel:${lead.telefone.replace(/\D/g, "")}`}>
                          <Phone className="size-3.5" />
                          <span className="hidden sm:inline">Ligar</span>
                        </a>
                      </Button>
                    ) : null}
                    <Button asChild size="sm" className="min-h-9 rounded-lg">
                      <Link to="/results/$searchId" params={{ searchId: lead.searchId }}>
                        Abrir
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Target}
              title="Nenhuma oportunidade no período"
              description="Rode uma busca para identificar empresas sem presença digital própria."
              action={
                <Button asChild className="min-h-11 rounded-xl">
                  <Link to="/search">Iniciar busca</Link>
                </Button>
              }
            />
          )}
        </section>

        <div className="space-y-4">
          <section aria-label="Distribuição digital" className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground">Distribuição digital</h2>
            <p className="text-xs text-muted-foreground">Como os leads aparecem online.</p>
            <div className="mt-4 space-y-3">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full rounded-lg" />)
              ) : stats?.distribution.length ? (
                stats.distribution.map((item) => (
                  <div key={item.type} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="min-w-0 truncate font-medium text-foreground">{item.label}</span>
                      <span className="tnum shrink-0 text-muted-foreground">
                        {item.count} · {item.share}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          item.type === "own_website" ? "bg-muted-foreground" : "bg-primary",
                        )}
                        style={{ width: `${Math.max(item.share, 2)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sem dados no período selecionado.</p>
              )}
            </div>
          </section>

          <section aria-label="Buscas recentes" className="rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">Buscas recentes</h2>
            </div>
            {isLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : stats?.recentSearches.length ? (
              <ul className="divide-y divide-border">
                {stats.recentSearches.map((search) => (
                  <li key={search.id}>
                    <Link
                      to="/results/$searchId"
                      params={{ searchId: search.id }}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/60"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium capitalize text-foreground">{search.termo}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {search.cidade} · {search.uf} · {search.total_leads ?? 0} leads
                        </p>
                      </div>
                      <SearchStatusBadge status={search.status} className="shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={ExternalLink}
                title="Sem atividade recente"
                description="Suas buscas aparecerão aqui."
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
