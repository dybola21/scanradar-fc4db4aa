import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Chrome, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";
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
          
          <div className="mb-6 flex justify-center">
            <AnimatedRadarScene size={240} />
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
              <Chrome className="mr-2 h-4 w-4 text-[#0B1220]" />
              {isGoogleLoading ? "Conectando..." : "Google"}
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
