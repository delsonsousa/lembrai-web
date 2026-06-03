"use client";

import { ArrowRight, CalendarHeart, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authFetch, readApiError } from "@/components/auth-client";

export function ManagerEventCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await authFetch("/api/dashboard/events", {
        method: "POST",
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Não foi possível criar."));
      }

      const body = (await response.json()) as { event: { slug: string } };
      router.push(`/dashboard/events/${body.event.slug}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Erro ao criar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f0e8] p-5 text-[#261f2d] sm:p-8">
      <form
        className="mx-auto max-w-xl rounded-[30px] border border-white bg-white p-6 shadow-[0_18px_50px_rgba(38,31,45,0.1)] sm:p-8"
        onSubmit={submit}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f3df] text-[#245b3c]">
          <CalendarHeart className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-4xl font-semibold">Criar evento</h1>
        <label className="mt-6 grid gap-2 text-sm font-medium text-[#46394e]">
          Nome do evento
          <input
            className="h-14 rounded-2xl border border-[#ddd1c6] bg-[#fffaf5] px-4 text-base outline-none focus:border-[#245b3c] focus:ring-4 focus:ring-[#245b3c]/12"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Aniversário de 1 ano do Isaac"
            minLength={3}
            required
          />
        </label>
        {error && <p className="mt-4 rounded-2xl bg-[#fff1ed] p-3 text-[#9f2d20]">{error}</p>}
        <button
          className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#f06f4f] px-5 font-semibold text-white"
          type="submit"
          disabled={submitting}
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
          Criar evento
        </button>
      </form>
    </main>
  );
}
