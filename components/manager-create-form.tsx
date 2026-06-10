"use client";

import {
  ArrowLeft,
  AtSign,
  BadgeCheck,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";

import { showToast } from "@/components/app-toast";
import { authFetch, readApiError } from "@/components/auth-client";
import { validatePasswordStrength } from "@/lib/password";

export function ManagerCreateForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const passwordValidation = validatePasswordStrength(password);

    if (!normalizedName || !normalizedEmail || !passwordValidation.ok) {
      showToast({
        type: "error",
        message:
          normalizedName && normalizedEmail
            ? passwordValidation.message
            : "Informe nome e e-mail.",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      showToast({ type: "error", message: "Informe um e-mail válido." });
      return;
    }

    setLoading(true);

    try {
      const response = await authFetch("/api/admin/managers", {
        method: "POST",
        body: JSON.stringify({
          name: normalizedName,
          email: normalizedEmail,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Não foi possível criar."));
      }

      showToast({ type: "success", message: "Gestor criado com sucesso." });
      setName("");
      setEmail("");
      setPassword("");
    } catch (submitError) {
      showToast({
        type: "error",
        message: submitError instanceof Error ? submitError.message : "Erro ao criar.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6efe7] px-5 py-6 text-[#261f2d] sm:px-8 lg:px-10">
      <div className="absolute left-[-16rem] top-[-18rem] h-[42rem] w-[42rem] rounded-full bg-[#f06f4f]/14 blur-[150px]" />
      <div className="absolute right-[-18rem] top-20 h-[38rem] w-[38rem] rounded-full bg-[#ffd7a4]/28 blur-[150px]" />
      <div className="absolute bottom-[-18rem] right-[-14rem] h-[42rem] w-[42rem] rounded-full bg-[#245b3c]/12 blur-[150px]" />
      <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-white/46 to-transparent" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col">
        <nav className="flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#261f2d]/10 bg-white/58 px-4 text-sm font-semibold text-[#261f2d] shadow-[0_16px_50px_rgba(38,31,45,0.08)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/82"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-[#245b3c]/10 bg-white/56 px-4 py-2 text-sm font-semibold text-[#245b3c] shadow-[0_16px_50px_rgba(38,31,45,0.07)] backdrop-blur-xl">
            <ShieldCheck className="h-4 w-4" />
            Platform admin
          </div>
        </nav>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[0.42fr_0.58fr] lg:gap-12 lg:py-12">
          <aside className="relative overflow-hidden rounded-[38px] bg-[#261f2d] p-6 text-white shadow-[0_34px_110px_rgba(38,31,45,0.28)] sm:p-8">
            <div className="absolute right-[-10rem] top-[-10rem] h-[28rem] w-[28rem] rounded-full bg-[#f06f4f]/28 blur-[120px]" />
            <div className="absolute bottom-[-12rem] left-[-10rem] h-[30rem] w-[30rem] rounded-full bg-[#ffd7a4]/10 blur-[120px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.10),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_42%)]" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-semibold text-[#ffd7a4] backdrop-blur-xl">
                <Sparkles className="h-4 w-4" />
                Novo acesso
              </div>

              <h1 className="mt-7 text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl">
                Crie um gestor com segurança.
              </h1>
              <p className="mt-5 text-lg leading-8 text-white/64">
                Cadastre quem vai operar eventos, QR Codes e mídias dentro do
                Lembraí. O acesso fica separado do admin da plataforma.
              </p>

              <div className="mt-9 grid gap-3">
                <ContextItem icon={<UserRound className="h-5 w-5" />}>
                  Perfil criado como gestor de eventos
                </ContextItem>
                <ContextItem icon={<LockKeyhole className="h-5 w-5" />}>
                  Senha temporária definida pelo admin
                </ContextItem>
                <ContextItem icon={<BadgeCheck className="h-5 w-5" />}>
                  Acesso pronto para entrar no painel
                </ContextItem>
              </div>
            </div>
          </aside>

          <form
            className="relative overflow-hidden rounded-[36px] border border-white/90 bg-white p-5 shadow-[0_34px_110px_rgba(38,31,45,0.18)] sm:p-7 lg:p-8"
            onSubmit={submit}
            noValidate
          >
            <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_18%_0%,rgba(240,111,79,0.14),transparent_34%),radial-gradient(circle_at_86%_8%,rgba(255,215,164,0.44),transparent_32%)]" />
            <div className="absolute bottom-[-9rem] right-[-8rem] h-72 w-72 rounded-full bg-[#245b3c]/8 blur-[100px]" />

            <div className="relative rounded-[28px] border border-[#261f2d]/8 bg-[#fffaf3] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] sm:p-7">
              <div className="flex items-start justify-between gap-5 border-b border-[#261f2d]/8 pb-6">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#245b3c]">
                    Platform admin
                  </p>
                  <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                    Criar gestor
                  </h2>
                  <p className="mt-3 max-w-lg leading-7 text-[#75675f]">
                    Preencha os dados iniciais. O gestor poderá acessar o painel
                    usando o e-mail e a senha temporária.
                  </p>
                </div>

                <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#261f2d] text-[#ffd7a4] shadow-[0_18px_50px_rgba(38,31,45,0.16)] sm:flex">
                  <UserPlus className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-7 grid gap-5">
                <Field
                  icon={<UserRound className="h-5 w-5" />}
                  label="Nome"
                  value={name}
                  onChange={setName}
                  placeholder="Nome do gestor"
                  autoComplete="name"
                />
                <Field
                  icon={<AtSign className="h-5 w-5" />}
                  label="E-mail"
                  value={email}
                  onChange={setEmail}
                  placeholder="gestor@empresa.com"
                  type="email"
                  autoComplete="email"
                />
                <Field
                  icon={<KeyRound className="h-5 w-5" />}
                  label="Senha temporária"
                  value={password}
                  onChange={setPassword}
                  placeholder="Defina uma senha inicial"
                  type="password"
                  autoComplete="new-password"
                />
              </div>

              <button
                className="mt-7 inline-flex min-h-16 w-full items-center justify-center gap-2 rounded-[20px] bg-[#f06f4f] px-6 text-base font-semibold text-white shadow-[0_24px_70px_rgba(240,111,79,0.34)] transition hover:-translate-y-0.5 hover:bg-[#da6043] hover:shadow-[0_30px_80px_rgba(240,111,79,0.42)] disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:translate-y-0"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <UserPlus className="h-5 w-5" />
                )}
                {loading ? "Criando acesso..." : "Criar gestor"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="group grid gap-2 text-sm font-semibold text-[#46394e]">
      {label}
      <div className="flex min-h-16 items-center gap-3 rounded-[20px] border border-[#ddd1c6] bg-white px-4 shadow-[0_12px_34px_rgba(38,31,45,0.04)] transition group-focus-within:border-[#f06f4f]/70 group-focus-within:ring-4 group-focus-within:ring-[#f06f4f]/10">
        <span className="text-[#b09f93] transition group-focus-within:text-[#f06f4f]">
          {icon}
        </span>
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-base text-[#261f2d] outline-none placeholder:text-[#b9a99d]"
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
      </div>
    </label>
  );
}

function ContextItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 p-4 text-sm font-semibold text-white/82 backdrop-blur-xl">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#261f2d]">
        {icon}
      </span>
      {children}
    </div>
  );
}
