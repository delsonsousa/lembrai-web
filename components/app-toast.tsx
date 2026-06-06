"use client";

import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";

type ToastType = "success" | "error";

type ToastPayload = {
  type: ToastType;
  message: string;
  duration?: number;
};

type ToastItem = ToastPayload & {
  id: string;
};

const TOAST_EVENT = "lembrai:toast";
const DEFAULT_TOAST_DURATION = 3000;

export function showToast(payload: ToastPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastPayload>(TOAST_EVENT, { detail: payload }));
}

export function AppToaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    function addToast(event: Event) {
      const customEvent = event as CustomEvent<ToastPayload>;
      const toast: ToastItem = {
        id: crypto.randomUUID(),
        duration: DEFAULT_TOAST_DURATION,
        ...customEvent.detail,
      };

      setToasts((current) => [toast, ...current].slice(0, 4));
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, toast.duration ?? DEFAULT_TOAST_DURATION);
    }

    window.addEventListener(TOAST_EVENT, addToast);
    return () => window.removeEventListener(TOAST_EVENT, addToast);
  }, []);

  if (!toasts.length) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:top-5"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-[20px] border px-4 py-3 shadow-[0_24px_80px_rgba(38,31,45,0.18)] backdrop-blur-xl animate-[toast-enter_220ms_ease-out_both] ${
            toast.type === "success"
              ? "border-[#b9dbc0] bg-[#f0fbef]/96 text-[#245b3c]"
              : "border-[#f1b5a8] bg-[#fff1ed]/96 text-[#9f2d20]"
          }`}
          role="status"
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <p className="min-w-0 flex-1 text-sm font-semibold leading-6">
            {toast.message}
          </p>
          <button
            type="button"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/55 transition hover:bg-white"
            onClick={() =>
              setToasts((current) => current.filter((item) => item.id !== toast.id))
            }
            aria-label="Fechar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
