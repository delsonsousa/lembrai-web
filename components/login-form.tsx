"use client";

import { Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { getSupabaseBrowser } from "@/lib/supabase-browser";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowser();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch("/api/auth/me", {
      headers: session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : undefined,
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        code?: string;
      } | null;

      setError(
        body?.code === "PROFILE_NOT_FOUND"
          ? "Login válido, mas este usuário ainda não tem profile. Use /setup para criar o primeiro admin ou crie o gestor pelo painel."
          : "Sessão inválida. Confira as chaves do Supabase e tente novamente."
      );
      setLoading(false);
      return;
    }

    const body = (await response.json()) as {
      profile: { role: "platform_admin" | "event_manager" };
    };

    router.push(body.profile.role === "platform_admin" ? "/admin" : "/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#f7f0e8] text-[#261f2d]">
      <div className="mx-auto grid min-h-screen w-full max-w-5xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[0.9fr_1fr] lg:items-center">
        <section className="rounded-[30px] bg-[#261f2d] p-7 text-white shadow-[0_24px_80px_rgba(38,31,45,0.22)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#ffd7a4]">
            Lembraí
          </p>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.02]">
            Área privada para gestores.
          </h1>
          <p className="mt-5 text-lg leading-8 text-white/70">
            Entre como administrador da plataforma ou gestor de evento para criar
            eventos, gerar QR Codes e baixar as mídias recebidas.
          </p>
        </section>

        <form
          className="rounded-[30px] border border-white bg-white p-6 shadow-[0_18px_50px_rgba(38,31,45,0.1)] sm:p-8"
          onSubmit={submit}
        >
          <h2 className="text-3xl font-semibold">Login</h2>
          <label className="mt-6 grid gap-2 text-sm font-medium text-[#46394e]">
            E-mail
            <input
              className="h-14 rounded-2xl border border-[#ddd1c6] bg-[#fffaf5] px-4 text-base outline-none focus:border-[#245b3c] focus:ring-4 focus:ring-[#245b3c]/12"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="mt-4 grid gap-2 text-sm font-medium text-[#46394e]">
            Senha
            <input
              className="h-14 rounded-2xl border border-[#ddd1c6] bg-[#fffaf5] px-4 text-base outline-none focus:border-[#245b3c] focus:ring-4 focus:ring-[#245b3c]/12"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && (
            <div className="mt-4 rounded-2xl border border-[#f1b5a8] bg-[#fff1ed] px-4 py-3 text-sm text-[#9f2d20]">
              <p>{error}</p>
              {error.includes("profile") && (
                <Link
                  className="mt-2 inline-flex font-semibold underline"
                  href="/setup"
                >
                  Abrir setup do primeiro admin
                </Link>
              )}
            </div>
          )}
          <button
            className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#f06f4f] px-5 font-semibold text-white shadow-[0_16px_34px_rgba(240,111,79,0.28)] transition hover:bg-[#da6043]"
            type="submit"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
