"use client";

import { Loader2, UserPlus } from "lucide-react";
import { useState } from "react";

import { authFetch, readApiError } from "@/components/auth-client";

export function ManagerCreateForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await authFetch("/api/admin/managers", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Não foi possível criar."));
      }

      setMessage("Gestor criado com sucesso.");
      setName("");
      setEmail("");
      setPassword("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro ao criar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f0e8] p-5 text-[#261f2d] sm:p-8">
      <form
        className="mx-auto max-w-xl rounded-[30px] border border-white bg-white p-6 shadow-[0_18px_50px_rgba(38,31,45,0.1)] sm:p-8"
        onSubmit={submit}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#245b3c]">
          Platform admin
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Criar gestor</h1>
        <Field label="Nome" value={name} onChange={setName} />
        <Field label="E-mail" value={email} onChange={setEmail} type="email" />
        <Field label="Senha temporária" value={password} onChange={setPassword} type="password" />
        {message && <p className="mt-4 rounded-2xl bg-[#f0fbef] p-3 text-[#245b3c]">{message}</p>}
        {error && <p className="mt-4 rounded-2xl bg-[#fff1ed] p-3 text-[#9f2d20]">{error}</p>}
        <button
          className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#f06f4f] px-5 font-semibold text-white"
          type="submit"
          disabled={loading}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
          Criar gestor
        </button>
      </form>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="mt-5 grid gap-2 text-sm font-medium text-[#46394e]">
      {label}
      <input
        className="h-14 rounded-2xl border border-[#ddd1c6] bg-[#fffaf5] px-4 text-base outline-none focus:border-[#245b3c] focus:ring-4 focus:ring-[#245b3c]/12"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </label>
  );
}
