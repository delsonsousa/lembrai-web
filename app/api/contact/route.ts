import { sendContactEmail } from "@/lib/email";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limit = rateLimit(request, {
    key: "contact",
    limit: 3,
    windowMs: 10 * 60 * 1000,
  });

  if (!limit.ok) {
    return rateLimitResponse(limit.retryAfterSeconds);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).name !== "string" ||
    typeof (body as Record<string, unknown>).email !== "string" ||
    typeof (body as Record<string, unknown>).subject !== "string" ||
    typeof (body as Record<string, unknown>).message !== "string"
  ) {
    return Response.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
  }

  const { name, email, subject, message } = body as {
    name: string;
    email: string;
    subject: string;
    message: string;
  };

  if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
    return Response.json({ error: "Preencha todos os campos." }, { status: 422 });
  }

  if (name.length > 100 || subject.length > 200 || message.length > 4000) {
    return Response.json({ error: "Conteúdo muito longo." }, { status: 422 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return Response.json({ error: "E-mail inválido." }, { status: 422 });
  }

  try {
    await sendContactEmail({ name, email, subject, message });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[contact] failed to send email:", err);
    return Response.json(
      { error: "Não foi possível enviar a mensagem. Tente novamente." },
      { status: 500 }
    );
  }
}
