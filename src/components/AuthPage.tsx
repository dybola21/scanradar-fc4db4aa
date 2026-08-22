import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Chrome, ArrowRight } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { AnimatedRadarLogo } from "./AnimatedRadarLogo";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary shadow-lg">
            <AnimatedRadarLogo size={38} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">ScanRadar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Prospecção e geração de leads</p>
        </div>

        <Card className="rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold tracking-tight">
              {isSignUp ? "Criar conta" : "Entrar"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11 rounded-xl"
                />
              </div>

              <Button type="submit" className="h-11 w-full rounded-xl font-medium" disabled={busy}>
                {isLoading ? (
                  "Entrando..."
                ) : (
                  <span className="flex items-center gap-2">
                    {isSignUp ? "Criar conta" : "Entrar"}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>

            <div className="relative">
              <span className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </span>
              <span className="relative mx-auto block w-fit bg-card px-3 text-xs text-muted-foreground">ou</span>
            </div>

            <Button
              variant="outline"
              className="h-11 w-full rounded-xl font-medium"
              onClick={handleGoogleSignIn}
              disabled={busy}
              aria-label="Entrar com Google"
            >
              <Chrome className="h-4 w-4" />
              {isGoogleLoading ? "Conectando..." : "Continuar com Google"}
            </Button>
          </CardContent>
          <CardFooter className="justify-center pb-6">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="min-h-11 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {isSignUp ? "Já tenho conta" : "Criar uma conta"}
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
