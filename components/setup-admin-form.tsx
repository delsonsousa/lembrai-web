"use client";

import { CheckCircle2, Database, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

async function readError(response: Response, fallback: string) {
  try {
    const body = await response.json();
    return typeof body.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

async function fetchSetupStatus(signal?: AbortSignal) {
  const response = await fetch("/api/setup/admin", { signal });
  if (!response.ok) {
    throw new Error(await readError(response, "Não foi possível carregar o setup."));
  }

  return (await response.json()) as SetupStatus;
}

type SetupStatus = {
  enabled: boolean;
  hasPlatformAdmin: boolean;
  schemaReady: boolean;
  canRunDatabaseSetup: boolean;
  diagnostic?: "schema_missing";
};

export function SetupAdminForm() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [secret, setSecret] = useState("");
  const [name, setName] = useState("Delson");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [databaseLoading, setDatabaseLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    setStatus(await fetchSetupStatus());
  }

  useEffect(() => {
    const controller = new AbortController();

    fetchSetupStatus(controller.signal)
      .then((body) => setStatus(body))
      .catch((loadError) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Não foi possível carregar o setup."
        );
      });

    return () => controller.abort();
  }, []);

  async function setupDatabase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDatabaseLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/setup/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });

      if (!response.ok) {
        throw new Error(
          await readError(response, "Não foi possível configurar o banco.")
        );
      }

      setMessage("Banco configurado. Agora crie o primeiro admin.");
      await loadStatus();
    } catch (setupError) {
      setError(
        setupError instanceof Error
          ? setupError.message
          : "Não foi possível configurar o banco."
      );
    } finally {
      setDatabaseLoading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/setup/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, name, email, password }),
      });

      if (!response.ok) {
        throw new Error(await readError(response, "Não foi possível criar admin."));
      }

      setMessage("Admin inicial criado. Você já pode fazer login.");
      setStatus({
        enabled: true,
        hasPlatformAdmin: true,
        schemaReady: true,
        canRunDatabaseSetup: status?.canRunDatabaseSetup ?? false,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível criar admin."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f0e8] p-5 text-[#261f2d] sm:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-5xl gap-8 lg:grid-cols-[0.9fr_1fr] lg:items-center">
        <section className="rounded-[30px] bg-[#261f2d] p-7 text-white shadow-[0_24px_80px_rgba(38,31,45,0.22)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-white/80">
            <ShieldCheck className="h-4 w-4 text-[#ffd7a4]" />
            Bootstrap seguro
          </div>
          <h1 className="mt-6 text-5xl font-semibold leading-[1.02]">
            Crie o primeiro admin sem SQL manual.
          </h1>
          <p className="mt-5 text-lg leading-8 text-white/70">
            Esta tela cria um usuário no Supabase Auth e vincula o profile
            `platform_admin`. Ela fica bloqueada depois que o primeiro admin
            existe.
          </p>
        </section>

        <section className="rounded-[30px] border border-white bg-white p-6 shadow-[0_18px_50px_rgba(38,31,45,0.1)] sm:p-8">
          {!status ? (
            <div className="flex items-center gap-3 text-[#6d5f58]">
              <Loader2 className="h-5 w-5 animate-spin" />
              Verificando setup...
            </div>
          ) : !status.schemaReady ? (
            <form onSubmit={setupDatabase}>
              <Database className="h-10 w-10 text-[#245b3c]" />
              <h2 className="mt-4 text-3xl font-semibold">
                Banco ainda não configurado
              </h2>
              <p className="mt-3 leading-7 text-[#6d5f58]">
                O Supabase conectado ainda não tem as tabelas do Lembraí.
                Configure `SUPABASE_DB_URL` e rode este bootstrap pela tela.
              </p>
              <Field
                label="Segredo de bootstrap"
                value={secret}
                onChange={setSecret}
                type="password"
              />
              {message && (
                <p className="mt-4 rounded-2xl bg-[#f0fbef] p-3 text-[#245b3c]">
                  {message}
                </p>
              )}
              {error && (
                <p className="mt-4 rounded-2xl bg-[#fff1ed] p-3 text-[#9f2d20]">
                  {error}
                </p>
              )}
              {!status.canRunDatabaseSetup && (
                <p className="mt-4 rounded-2xl bg-[#fff7df] p-3 text-[#7c551a]">
                  Adicione `SUPABASE_DB_URL` no `.env.local` e reinicie o
                  servidor para habilitar a configuração automática.
                </p>
              )}
              <button
                className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#f06f4f] px-5 font-semibold text-white disabled:opacity-60"
                type="submit"
                disabled={databaseLoading || !status.canRunDatabaseSetup}
              >
                {databaseLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                Configurar banco automaticamente
              </button>
            </form>
          ) : status.hasPlatformAdmin ? (
            <div>
              <CheckCircle2 className="h-10 w-10 text-[#245b3c]" />
              <h2 className="mt-4 text-3xl font-semibold">Admin já configurado</h2>
              <p className="mt-3 leading-7 text-[#6d5f58]">
                O bootstrap foi bloqueado porque já existe um `platform_admin`.
              </p>
              <Link
                className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#f06f4f] px-5 font-semibold text-white"
                href="/login"
              >
                Ir para login
              </Link>
            </div>
          ) : !status.enabled ? (
            <div>
              <h2 className="text-3xl font-semibold">Configure o segredo</h2>
              <p className="mt-3 leading-7 text-[#6d5f58]">
                Adicione `BOOTSTRAP_ADMIN_SECRET` no `.env.local` e reinicie o
                servidor.
              </p>
            </div>
          ) : (
            <form onSubmit={submit}>
              <h2 className="text-3xl font-semibold">Primeiro admin</h2>
              <Field label="Segredo de bootstrap" value={secret} onChange={setSecret} type="password" />
              <Field label="Nome" value={name} onChange={setName} />
              <Field label="E-mail" value={email} onChange={setEmail} type="email" />
              <Field label="Senha" value={password} onChange={setPassword} type="password" />
              {message && (
                <p className="mt-4 rounded-2xl bg-[#f0fbef] p-3 text-[#245b3c]">
                  {message}
                </p>
              )}
              {error && (
                <p className="mt-4 rounded-2xl bg-[#fff1ed] p-3 text-[#9f2d20]">
                  {error}
                </p>
              )}
              <button
                className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#f06f4f] px-5 font-semibold text-white disabled:opacity-60"
                type="submit"
                disabled={loading}
              >
                {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                Criar admin inicial
              </button>
            </form>
          )}
        </section>
      </div>
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
