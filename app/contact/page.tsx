"use client";

import { ArrowRight, CheckCircle2, Mail, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BrandLogo } from "@/components/brand-logo";

type FormState = "idle" | "sending" | "sent" | "error";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "Erro ao enviar mensagem."
        );
      }

      setState("sent");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao enviar mensagem.");
      setState("error");
    }
  }

  return (
    <main className="min-h-screen bg-[#f6efe7] text-[#261f2d]">
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex h-9 w-28 items-center transition hover:opacity-80"
            aria-label="Lembraí — página inicial"
          >
            <BrandLogo className="h-full w-full object-contain" sizes="112px" />
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-[#e5d9cb] bg-white/70 px-4 py-2 text-sm font-semibold text-[#46394e] transition hover:bg-white"
          >
            Acessar painel
          </Link>
        </nav>
      </div>

      <section className="px-5 pb-24 pt-10 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#245b3c]">
                Fale conosco
              </p>
              <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-[-0.05em] sm:text-6xl">
                Como podemos ajudar?
              </h1>
              <p className="mt-5 max-w-md text-lg leading-8 text-[#6d5f58]">
                Tem dúvida, sugestão ou precisa de suporte? Manda uma mensagem —
                respondemos pelo e-mail que você informar.
              </p>

              <div className="mt-10 space-y-4">
                <InfoItem
                  icon={<Mail className="h-5 w-5" />}
                  label="E-mail de suporte"
                  value="contato@lembraieventos.com.br"
                />
                <InfoItem
                  icon={<MessageSquare className="h-5 w-5" />}
                  label="Tempo de resposta"
                  value="Em até 1 dia útil"
                />
              </div>
            </div>

            <div className="rounded-[34px] border border-white bg-white/78 p-7 shadow-[0_26px_90px_rgba(38,31,45,0.11)] sm:p-10">
              {state === "sent" ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f3df] text-[#245b3c]">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h2 className="mt-5 text-2xl font-semibold">Mensagem enviada!</h2>
                  <p className="mt-3 max-w-xs leading-7 text-[#6d5f58]">
                    Recebemos sua mensagem e vamos responder no e-mail{" "}
                    <strong>{email}</strong> em breve.
                  </p>
                  <button
                    onClick={() => {
                      setName("");
                      setEmail("");
                      setSubject("");
                      setMessage("");
                      setState("idle");
                    }}
                    className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-[#eadfd2] bg-[#f6efe7] px-5 py-3 text-sm font-semibold text-[#46394e] transition hover:bg-[#ede3d6]"
                  >
                    Enviar outra mensagem
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                    Envie sua mensagem
                  </h2>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Seu nome">
                      <input
                        type="text"
                        required
                        maxLength={100}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex.: Maria Silva"
                        className="input-field"
                        disabled={state === "sending"}
                      />
                    </Field>
                    <Field label="Seu e-mail">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="voce@email.com"
                        className="input-field"
                        disabled={state === "sending"}
                      />
                    </Field>
                  </div>

                  <Field label="Assunto">
                    <input
                      type="text"
                      required
                      maxLength={200}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Ex.: Dúvida sobre o QR Code"
                      className="input-field"
                      disabled={state === "sending"}
                    />
                  </Field>

                  <Field label="Mensagem">
                    <textarea
                      required
                      maxLength={4000}
                      rows={6}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Descreva sua dúvida ou mensagem..."
                      className="input-field resize-none"
                      disabled={state === "sending"}
                    />
                  </Field>

                  {state === "error" && (
                    <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={state === "sending"}
                    className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#f06f4f] px-6 text-base font-semibold text-white shadow-[0_18px_50px_rgba(240,111,79,0.30)] transition hover:-translate-y-0.5 hover:bg-[#da6043] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {state === "sending" ? "Enviando…" : "Enviar mensagem"}
                    {state !== "sending" && <ArrowRight className="h-5 w-5" />}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .input-field {
          width: 100%;
          border-radius: 14px;
          border: 1px solid #eadfd2;
          background: #fffaf3;
          padding: 12px 16px;
          font-size: 15px;
          color: #261f2d;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input-field::placeholder { color: #a89c94; }
        .input-field:focus {
          border-color: #f06f4f;
          box-shadow: 0 0 0 3px rgba(240,111,79,0.14);
        }
        .input-field:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-[#46394e]">{label}</label>
      {children}
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-3xl border border-[#eadfd2] bg-white p-5 shadow-[0_14px_40px_rgba(38,31,45,0.06)]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fff0ea] text-[#f06f4f]">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-[#6d5f58]">{label}</p>
        <p className="mt-0.5 font-semibold">{value}</p>
      </div>
    </div>
  );
}
