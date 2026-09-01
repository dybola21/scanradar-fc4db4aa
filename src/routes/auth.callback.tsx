import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrando… — ScanRadar" },
      { name: "description", content: "Finalizando o login no ScanRadar." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Entrando… — ScanRadar" },
      { property: "og:description", content: "Finalizando o login no ScanRadar." },
    ],
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Finalizando login…");

  useEffect(() => {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      navigate({ to: "/dashboard", replace: true });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) go();
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go();
    });

    const timeout = setTimeout(() => {
      if (!done) {
        setMessage("Não foi possível concluir o login. Redirecionando…");
        navigate({ to: "/auth", replace: true });
      }
    }, 8000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 bg-[#07111F] text-[#F6F8FB]">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#38BDF8] border-t-transparent" />
      <p className="text-sm text-[#9FB1C7]">{message}</p>
    </div>
  );
}
