import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logScanEvent } from "@/lib/logs.functions";
import { useServerFn } from "@tanstack/react-start";

import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { ScanRadarLogo } from "./ScanRadarLogo";
import { AnimatedRadarScene } from "./AnimatedRadarScene";

/**
 * Scoped colors for AuthPage to prevent global side effects:
 * Right background: #F5F7FA
 * Right Title: #0B1220
 * Right Secondary text: #526174
 * Card: #FFFFFF
 * Inputs: #F3F6FA
 * Borders: #D5DEE9
 * Left Text: #F6F8FB
 * Left Subtitle: #9FB1C7
 * Accent Blue: #0369A1 (WCAG AA compliant with white text)
 * Success Green: #22C55E
 */

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const logEventFn = useServerFn(logScanEvent);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await logEventFn({
          data: {
            eventType: 'AUTH_ACTION' as any,
            eventStatus: 'success',
            message: `Usuário logado: ${session.user.email}`,
            payload: { email: session.user.email, provider: session.user.app_metadata.provider }
          }
        }).catch(console.error);
      }
      if (event === 'SIGNED_OUT') {
        // signed_out case is harder to log since session is gone, but we could log it if needed
      }
    });

    return () => subscription.unsubscribe();
  }, [logEventFn]);


  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Cadastro realizado. Confirme o e-mail para entrar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (error: any) {
      toast.error(error?.message ?? "Não foi possível concluir a operação.");
      await logEventFn({
        data: {
          eventType: 'AUTH_ACTION' as any,
          eventStatus: 'failed',
          message: `Falha na autenticação: ${email}`,
          errorMessage: error?.message,
          payload: { email, isSignUp }
        }
      }).catch(console.error);
    } finally {

      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate({ to: "/dashboard" });
    } catch (error: any) {
      toast.error(error?.message ?? "Não foi possível entrar com o Google.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const busy = isLoading || isGoogleLoading;

  return (
    <div className="flex min-h-dvh w-full overflow-hidden bg-[#07111F]">
      {/* Left side: Hero & Radar (Hidden on mobile) */}
      <div className="relative hidden w-[55%] flex-col border-r border-[#263750] bg-[#07111F] p-8 lg:flex lg:px-12 lg:py-10">
        <div className="absolute inset-0 z-0 opacity-20">
          {/* Abstract grid lines for map feel */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.1)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="relative z-10 mx-auto flex h-full w-full max-w-[600px] flex-col">
          {/* Logo at the top left of the container */}
          <div className="mb-8 flex items-center lg:mb-12">
            <ScanRadarLogo size={36} theme="dark" />
          </div>

          <div className="flex flex-1 flex-col items-center justify-center py-2 lg:py-4">
            <div className="mb-2 lg:mb-4">
              <AnimatedRadarScene size={360} />
            </div>

            <div className="max-w-[580px] space-y-3 text-center lg:space-y-5">
              <h2 className="text-3xl font-bold tracking-tight text-[#F6F8FB] lg:text-5xl">
                Encontre empresas antes que a oportunidade passe.
              </h2>
              <p className="text-base text-[#9FB1C7] lg:text-lg">
                Mapeie negócios locais, identifique presença digital e transforme dados públicos em prospecção organizada.
              </p>

              <div className="flex flex-col items-center gap-2 pt-2 lg:gap-3 lg:pt-3">
                {[
                  "Busca por nicho e localização",
                  "Classificação de presença digital",
                  "Resultados prontos para ação"
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#F6F8FB]/80 lg:text-sm">
                    <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div className="flex w-full flex-col items-center justify-center bg-[#F5F7FA] p-6 lg:w-[45%] lg:p-12">
        {/* Mobile Logo and Hero (Only visible on small screens) */}
        <div className="mb-8 flex flex-col items-center lg:hidden">
          <div className="mb-8 flex items-center">
            <ScanRadarLogo size={32} theme="light" />
          </div>
          
          <div className="relative mb-6 flex w-full max-w-[320px] items-center justify-center overflow-hidden rounded-2xl border border-[#263750] bg-[#07111F] py-8 shadow-lg">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.08)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <AnimatedRadarScene size={220} />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-[#0B1220]">
            Encontre empresas agora.
          </h2>
          <p className="mb-4 text-center text-sm text-[#526174]">
            Transforme dados do Google Maps em leads qualificados.
          </p>
        </div>

        <div className="w-full max-w-[440px]">
          {/* Header section aligned in column */}
          <div className="mb-4 flex flex-col items-center lg:items-start">
            <h1 className="text-3xl font-bold tracking-tight text-[#0B1220]">
              {isSignUp ? "Crie sua conta" : "Bem-vindo de volta"}
            </h1>
            <p className="mt-2 text-[#526174]">
              {isSignUp ? "Comece a prospectar leads hoje mesmo." : "Entre na sua conta para continuar suas buscas."}
            </p>
          </div>

          <div className="space-y-6 rounded-2xl border border-[#D5DEE9] bg-white p-8 shadow-sm">
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#526174]">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl border-[#D5DEE9] bg-[#F3F6FA] text-[#0B1220] placeholder:text-slate-400 focus:border-[#0369A1] focus:ring-[#0369A1]/20"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" translate="no" className="text-sm font-medium text-[#526174]">Senha</Label>
                  {!isSignUp && (
                    <button type="button" className="text-xs text-[#0369A1] hover:underline">
                      Esqueci minha senha
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-12 rounded-xl border-[#D5DEE9] bg-[#F3F6FA] pr-10 text-[#0B1220] placeholder:text-slate-400 focus:border-[#0369A1] focus:ring-[#0369A1]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0B1220]"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="h-[50px] w-full rounded-xl bg-[#0369A1] font-semibold text-white hover:bg-[#0369A1]/90 focus:ring-2 focus:ring-[#0369A1] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all" 
                disabled={busy}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isSignUp ? "Criar conta" : "Entrar no ScanRadar"}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="relative flex items-center gap-4">
              <div className="h-px flex-1 bg-[#D5DEE9]" />
              <span className="text-xs uppercase text-[#526174]">ou continue com</span>
              <div className="h-px flex-1 bg-[#D5DEE9]" />
            </div>

            <Button
              variant="outline"
              type="button"
              className="h-12 w-full rounded-xl border-[#D5DEE9] bg-white font-medium text-[#0B1220] hover:bg-[#F3F6FA] transition-colors"
              onClick={handleGoogleSignIn}
              disabled={busy}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {isGoogleLoading ? "Conectando..." : "Continuar com Google"}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-[#526174] transition-colors hover:text-[#0B1220]"
              >
                {isSignUp ? (
                  <>Já tem uma conta? <span className="font-semibold text-[#0369A1]">Entrar</span></>
                ) : (
                  <>Não tem uma conta? <span className="font-semibold text-[#0369A1]">Criar conta</span></>
                )}
              </button>
            </div>
          </div>
          
          <p className="mt-8 text-center text-xs text-[#526174]">
            Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
          </p>
        </div>
      </div>
    </div>
  );
}
