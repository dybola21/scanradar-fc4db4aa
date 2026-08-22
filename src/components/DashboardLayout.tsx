import { Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Search,
  History,
  Settings,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
} from "lucide-react";
import { AnimatedRadarLogo } from "./AnimatedRadarLogo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { getIntegrationStatus } from "@/lib/scraper.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Nova busca", icon: Search, to: "/search" },
  { label: "Histórico", icon: History, to: "/history" },
  { label: "Configurações", icon: Settings, to: "/settings" },
] as const;

const COLLAPSE_KEY = "scanradar:sidebar-collapsed";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  const fetchStatus = useServerFn(getIntegrationStatus);
  const { data: integration } = useQuery({
    queryKey: ["integration-status"],
    queryFn: () => fetchStatus(),
    staleTime: 60_000,
  });

  useEffect(() => {
    setIsCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      navigate({ to: "/auth" });
    }
  };

  const connectionState = !integration?.configured
    ? { label: "Integração não configurada", tone: "bg-muted-foreground" }
    : integration.is_connected
      ? { label: "Integração conectada", tone: "bg-success" }
      : { label: "Integração pendente de teste", tone: "bg-warning" };

  const NavContent = ({ mobile = false }: { mobile?: boolean }) => {
    const compact = isCollapsed && !mobile;
    return (
      <div className="flex h-full flex-col gap-6 py-4">
        <nav className="flex-1 space-y-1 px-3" aria-label="Navegação principal">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.to ||
              (item.to === "/history" && location.pathname.startsWith("/results"));
            const link = (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => mobile && setIsMobileMenuOpen(false)}
                aria-current={isActive ? "page" : undefined}
                aria-label={compact ? item.label : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                  compact && "justify-center px-0",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <item.icon className="size-[18px] shrink-0" />
                {!compact && <span className="truncate">{item.label}</span>}
              </Link>
            );

            if (!compact) return link;
            return (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3 px-3">
          <Link
            to="/settings"
            onClick={() => mobile && setIsMobileMenuOpen(false)}
            className={cn(
              "flex min-h-11 items-center gap-2.5 rounded-xl border border-border bg-secondary/60 px-3 text-left transition-colors hover:bg-secondary",
              compact && "justify-center px-0",
            )}
            aria-label={connectionState.label}
            title={connectionState.label}
          >
            <span className={cn("size-2 shrink-0 rounded-full", connectionState.tone)} aria-hidden />
            {!compact && (
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium text-foreground">n8n</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {connectionState.label}
                </span>
              </span>
            )}
          </Link>

          <div
            className={cn(
              "flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5",
              compact && "justify-center px-0",
            )}
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
              {(email ?? "?").charAt(0).toUpperCase()}
            </span>
            {!compact && (
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium text-foreground">
                  {email ?? "Carregando…"}
                </span>
                <span className="block text-[11px] text-muted-foreground">Conta ativa</span>
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            onClick={handleLogout}
            aria-label="Sair da conta"
            className={cn(
              "min-h-11 w-full justify-start gap-2.5 rounded-xl px-3 text-sm font-medium text-muted-foreground hover:bg-destructive-soft hover:text-destructive",
              compact && "justify-center px-0",
            )}
          >
            <LogOut className="size-[18px] shrink-0" />
            {!compact && <span>Sair</span>}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-dvh bg-background">
        <aside
          className={cn(
            "fixed z-40 hidden h-dvh flex-col border-r border-border bg-sidebar transition-[width] duration-200 md:flex",
            isCollapsed ? "w-[72px]" : "w-[280px]",
          )}
        >
          <div
            className={cn(
              "flex h-16 items-center gap-2 border-b border-border px-3",
              isCollapsed && "justify-center px-0",
            )}
          >
            <Link
              to="/dashboard"
              className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-lg px-1"
              aria-label="ScanRadar — ir para o dashboard"
            >
              <AnimatedRadarLogo size={30} />
              {!isCollapsed && (
                <span className="truncate text-[17px] font-semibold tracking-tight text-foreground">
                  ScanRadar
                </span>
              )}
            </Link>
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapsed}
                className="ml-auto size-9 rounded-lg text-muted-foreground"
                aria-label="Recolher menu lateral"
              >
                <PanelLeftClose className="size-[18px]" />
              </Button>
            )}
          </div>
          {isCollapsed && (
            <div className="flex justify-center py-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapsed}
                className="size-9 rounded-lg text-muted-foreground"
                aria-label="Expandir menu lateral"
              >
                <PanelLeftOpen className="size-[18px]" />
              </Button>
            </div>
          )}
          <NavContent />
        </aside>

        <div
          className={cn("hidden shrink-0 transition-[width] duration-200 md:block", isCollapsed ? "w-[72px]" : "w-[280px]")}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:hidden">
            <Link
              to="/dashboard"
              className="flex min-h-11 min-w-0 items-center gap-2.5"
              aria-label="ScanRadar — ir para o dashboard"
            >
              <AnimatedRadarLogo size={28} />
              <span className="truncate text-[17px] font-semibold tracking-tight">ScanRadar</span>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <Button asChild size="icon" className="min-h-11 min-w-11 rounded-xl" aria-label="Nova busca">
                <Link to="/search">
                  <Plus className="size-5" />
                </Link>
              </Button>
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="min-h-11 min-w-11 rounded-xl" aria-label="Abrir menu">
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                  <div className="flex h-16 items-center gap-2.5 border-b border-border px-4">
                    <AnimatedRadarLogo size={28} />
                    <SheetTitle className="text-[17px] font-semibold tracking-tight">ScanRadar</SheetTitle>
                  </div>
                  <NavContent mobile />
                </SheetContent>
              </Sheet>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
