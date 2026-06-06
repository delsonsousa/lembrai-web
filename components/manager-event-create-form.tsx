"use client";

import {
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  Loader2,
  Palette,
  QrCode,
  UploadCloud,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";

import { showToast } from "@/components/app-toast";
import { authFetch } from "@/components/auth-client";

const QR_COLORS = ["#261f2d", "#f06f4f", "#245b3c", "#7b4b2a"];
const QR_BACKGROUND_COLOR = "#fffaf5";
const MAX_LOGO_FILE_SIZE = 2 * 1024 * 1024;

function normalizePreviewSlug(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);

  return slug || "nome-do-evento";
}

function resizeImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.onload = () => {
      const image = new window.Image();
      image.onerror = () => reject(new Error("Use uma imagem PNG, JPG ou WebP."));
      image.onload = () => {
        const maxSize = 420;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Não foi possível preparar a imagem."));
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/webp", 0.82));
      };
      image.src = String(reader.result);
    };

    reader.readAsDataURL(file);
  });
}

export function ManagerEventCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [qrAccentColor, setQrAccentColor] = useState(QR_COLORS[0]);
  const [qrLogoDataUrl, setQrLogoDataUrl] = useState<string | null>(null);
  const [qrLogoName, setQrLogoName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const previewSlug = normalizePreviewSlug(name);
  const today = new Date().toISOString().slice(0, 10);
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 2);
  const maxDateInput = maxDate.toISOString().slice(0, 10);

  async function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast({ type: "error", message: "Use uma imagem para personalizar o QR Code." });
      return;
    }

    if (file.size > MAX_LOGO_FILE_SIZE) {
      showToast({ type: "error", message: "A imagem precisa ter até 2 MB." });
      return;
    }

    try {
      const dataUrl = await resizeImage(file);
      setQrLogoDataUrl(dataUrl);
      setQrLogoName(file.name);
    } catch (logoError) {
      showToast({
        type: "error",
        message:
          logoError instanceof Error
            ? logoError.message
            : "Não foi possível carregar a imagem.",
      });
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();

    if (normalizedName.length < 3) {
      showToast({ type: "error", message: "Digite o nome do evento." });
      return;
    }

    if (!eventDate) {
      showToast({ type: "error", message: "Escolha a data do evento." });
      return;
    }

    setSubmitting(true);

    try {
      const response = await authFetch("/api/dashboard/events", {
        method: "POST",
        body: JSON.stringify({
          name: normalizedName,
          eventDate,
          qrAccentColor,
          qrBackgroundColor: QR_BACKGROUND_COLOR,
          qrLogoDataUrl,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          redirectTo?: string;
          error?: string;
        } | null;

        if (body?.redirectTo) {
          router.replace(body.redirectTo);
          return;
        }

        throw new Error(body?.error ?? "Não foi possível criar.");
      }

      const body = (await response.json()) as { event: { slug: string } };
      router.push(`/dashboard/events/${body.event.slug}`);
    } catch (submitError) {
      showToast({
        type: "error",
        message: submitError instanceof Error ? submitError.message : "Erro ao criar.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6efe7] text-[#261f2d]">
      <div className="absolute left-[-18rem] top-[-18rem] h-[46rem] w-[46rem] rounded-full bg-[#f06f4f]/14 blur-[160px]" />
      <div className="absolute bottom-[-20rem] right-[-16rem] h-[46rem] w-[46rem] rounded-full bg-[#245b3c]/10 blur-[160px]" />
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-white/46 to-transparent" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-5 px-5 py-6 sm:px-8 lg:px-10">
        <Link
          href="/dashboard"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-[#eadfd2] bg-white/70 px-4 py-2 text-sm font-semibold text-[#6d5f58] shadow-[0_14px_38px_rgba(38,31,45,0.06)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white hover:text-[#261f2d]"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <section className="grid gap-5 lg:grid-cols-[1fr_330px]">
          <form
            className="relative overflow-hidden rounded-[42px] border border-white/85 bg-white/82 p-7 shadow-[0_42px_140px_rgba(38,31,45,0.15),inset_0_1px_0_rgba(255,255,255,0.78)] backdrop-blur-2xl sm:p-9"
            onSubmit={submit}
            noValidate
          >
            <div className="absolute right-[-8rem] top-[-9rem] h-72 w-72 rounded-full bg-[#f06f4f]/12 blur-[92px]" />
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />

            <div className="relative">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#245b3c]">
                Novo evento
              </p>
              <h1 className="mt-3 text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl">
                Qual é o nome da festa?
              </h1>

              <label className="mt-8 block">
                <span className="sr-only">Nome do evento</span>
                <input
                  className="h-20 w-full rounded-[26px] border border-[#eadfd2] bg-[#fffaf3] px-6 text-2xl font-semibold tracking-[-0.035em] outline-none transition placeholder:text-[#b2a69d] focus:border-[#f06f4f]/60 focus:bg-white focus:ring-4 focus:ring-[#f06f4f]/10"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex: Aniversário do Isaac"
                  autoFocus
                />
              </label>

              <label className="mt-4 grid gap-2 text-sm font-semibold text-[#46394e]">
                Data do evento
                <input
                  className="h-16 rounded-[22px] border border-[#eadfd2] bg-[#fffaf3] px-5 text-lg font-semibold outline-none transition focus:border-[#f06f4f]/60 focus:bg-white focus:ring-4 focus:ring-[#f06f4f]/10"
                  type="date"
                  value={eventDate}
                  min={today}
                  max={maxDateInput}
                  onChange={(event) => setEventDate(event.target.value)}
                />
              </label>

              <div className="mt-7 rounded-[30px] border border-[#eadfd2] bg-[#fffaf3]/80 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-white text-[#f06f4f] shadow-sm">
                    <Palette className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold">Personalize o QR Code</p>
                    <p className="text-sm text-[#75675f]">
                      Opcional. Escolha uma cor e adicione uma logo ou imagem.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {QR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setQrAccentColor(color)}
                      className={`h-10 w-10 rounded-full border-4 transition ${
                        qrAccentColor === color
                          ? "border-white shadow-[0_0_0_2px_rgba(38,31,45,0.32)]"
                          : "border-white/70 shadow-sm"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Usar cor ${color}`}
                    />
                  ))}
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[18px] bg-white px-4 text-sm font-semibold text-[#261f2d] shadow-sm transition hover:-translate-y-0.5">
                    <UploadCloud className="h-4 w-4" />
                    Adicionar imagem
                    <input
                      className="sr-only"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleLogoChange}
                    />
                  </label>

                  {qrLogoDataUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        setQrLogoDataUrl(null);
                        setQrLogoName(null);
                      }}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] border border-[#eadfd2] px-4 text-sm font-semibold text-[#6d5f58] transition hover:bg-white"
                    >
                      <X className="h-4 w-4" />
                      Remover imagem
                    </button>
                  ) : null}
                </div>

                {qrLogoName ? (
                  <p className="mt-3 truncate text-sm font-medium text-[#75675f]">
                    Imagem: {qrLogoName}
                  </p>
                ) : null}
              </div>

              <button
                className="mt-7 inline-flex min-h-16 w-full items-center justify-center gap-2 rounded-[22px] bg-[#f06f4f] px-6 text-base font-semibold text-white shadow-[0_24px_70px_rgba(240,111,79,0.34)] transition hover:-translate-y-0.5 hover:bg-[#da6043] disabled:cursor-wait disabled:opacity-70"
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ArrowRight className="h-5 w-5" />
                )}
                {submitting ? "Criando..." : "Criar evento e QR Code"}
              </button>
            </div>
          </form>

          <aside className="rounded-[38px] bg-[#261f2d] p-5 text-white shadow-[0_34px_110px_rgba(38,31,45,0.22)]">
            <div className="rounded-[30px] border border-white/10 bg-white/8 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ffd7a4]">
                Prévia
              </p>
              <div
                className="relative mt-5 rounded-[26px] p-5"
                style={{ backgroundColor: QR_BACKGROUND_COLOR }}
              >
                <div className="grid aspect-square grid-cols-5 gap-2 rounded-[20px] bg-white p-4">
                  {Array.from({ length: 25 }).map((_, index) => {
                    const active = [0, 1, 5, 6, 4, 9, 20, 21, 15, 16, 12, 13, 17].includes(
                      index
                    );
                    return (
                      <span
                        key={index}
                        className="rounded-md"
                        style={{ backgroundColor: active ? qrAccentColor : "#f3ece4" }}
                      />
                    );
                  })}
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  {qrLogoDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrLogoDataUrl}
                      alt=""
                      className="h-20 w-20 rounded-3xl border-4 border-white object-cover shadow-[0_18px_42px_rgba(38,31,45,0.24)]"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-white bg-[#fffaf3] text-[#f06f4f] shadow-[0_18px_42px_rgba(38,31,45,0.18)]">
                      <ImageIcon className="h-7 w-7" />
                    </div>
                  )}
                </div>
              </div>

              <h2 className="mt-6 text-3xl font-semibold leading-tight tracking-[-0.045em]">
                {name.trim() || "Nome da festa"}
              </h2>
              <p className="mt-3 truncate font-mono text-sm text-white/48">
                /e/{previewSlug}
              </p>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-[24px] border border-white/10 bg-white/8 p-4 text-sm leading-6 text-white/62">
              <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-[#ffd7a4]" />
              <p>
                Esse visual será usado no QR Code que você vai baixar e divulgar.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
