import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Chrome, ArrowRight, Eye, EyeOff } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { AnimatedRadarLogo } from "./AnimatedRadarLogo";

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
    <div className="flex min-h-dvh w-full overflow-hidden bg-scan-bg text-scan-text">
      {/* Left side: Hero & Radar (Hidden on mobile) */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center border-r border-scan-border bg-[#07111F] p-12 lg:flex">
        <div className="absolute inset-0 z-0 opacity-40">
           {/* Abstract grid lines for map feel */}
           <div className="absolute inset-0 bg-[linear-gradient(rgba(38,55,80,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(38,55,80,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
        
        <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
          <div className="mb-12">
            <AnimatedRadarLogo variant="hero" size={400} />
          </div>
          
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-white lg:text-5xl">
            Encontre empresas antes que a oportunidade passe.
          </h2>
          <p className="text-lg text-scan-text-muted">
            Mapeie negócios locais, identifique presença digital e transforme dados públicos em prospecção organizada.
          </p>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2 lg:p-12">
        <div className="w-full max-w-[400px]">
          {/* Logo mobile-only or compact top */}
          <div className="mb-8 flex flex-col items-center lg:items-start">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-scan-accent">
                <AnimatedRadarLogo size={28} />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">ScanRadar</span>
            </div>
            
            {/* Mobile Hero Text (Only visible on small screens) */}
            <div className="block text-center lg:hidden">
              <div className="mb-6 flex justify-center">
                <AnimatedRadarLogo variant="hero" size={200} />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-white">
                Encontre empresas agora.
              </h2>
              <p className="mb-8 text-sm text-scan-text-muted">
                Transforme dados do Google Maps em leads qualificados.
              </p>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-white">
              {isSignUp ? "Crie sua conta" : "Bem-vindo de volta"}
            </h1>
            <p className="mt-2 text-scan-text-muted">
              {isSignUp ? "Comece a prospectar leads hoje mesmo." : "Entre na sua conta para continuar suas buscas."}
            </p>
          </div>

          <div className="space-y-6 rounded-2xl border border-scan-border bg-scan-surface p-8 shadow-2xl">
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-scan-text-muted">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl border-scan-border bg-scan-field text-white placeholder:text-slate-600 focus:border-scan-accent focus:ring-scan-accent/20"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" translate="no" className="text-sm font-medium text-scan-text-muted">Senha</Label>
                  {!isSignUp && (
                    <button type="button" className="text-xs text-scan-accent hover:underline">
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
                    className="h-12 rounded-xl border-scan-border bg-scan-field pr-10 text-white placeholder:text-slate-600 focus:border-scan-accent focus:ring-scan-accent/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="h-12 w-full rounded-xl bg-scan-accent font-semibold text-[#07111F] hover:bg-scan-accent/90" 
                disabled={busy}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
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

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-scan-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-scan-surface px-2 text-scan-text-muted">ou continue com</span>
              </div>
            </div>

            <Button
              variant="outline"
              type="button"
              className="h-12 w-full rounded-xl border-scan-border bg-transparent font-medium text-white hover:bg-scan-field hover:text-white"
              onClick={handleGoogleSignIn}
              disabled={busy}
            >
              <Chrome className="mr-2 h-4 w-4" />
              {isGoogleLoading ? "Conectando..." : "Google"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-scan-text-muted transition-colors hover:text-white"
              >
                {isSignUp ? (
                  <>Já tem uma conta? <span className="font-semibold text-scan-accent">Entrar</span></>
                ) : (
                  <>Não tem uma conta? <span className="font-semibold text-scan-accent">Criar conta</span></>
                )}
              </button>
            </div>
          </div>
          
          <p className="mt-8 text-center text-xs text-scan-text-muted">
            Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
          </p>
        </div>
      </div>
    </div>
  );
}
