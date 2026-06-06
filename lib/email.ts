type RetentionReminderEmailInput = {
  to: string;
  managerName: string | null;
  eventName: string;
  eventSlug: string;
  expiresAt: string;
};

type VerificationCodeEmailInput = {
  to: string;
  code: string;
};

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

function getEmailFrom() {
  return process.env.EMAIL_FROM ?? "Lembraí <noreply@lembrai.com.br>";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[Lembraí] E-mail não enviado em dev: ${subject} -> ${to}`);
      return;
    }

    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend failed: ${body}`);
  }
}

export async function sendVerificationCodeEmail({
  to,
  code,
}: VerificationCodeEmailInput) {
  const safeCode = escapeHtml(code);

  await sendEmail({
    to,
    subject: "Código de verificação do Lembraí",
    html: `
      <div style="background:#f6efe7;padding:32px;font-family:Arial,sans-serif;color:#261f2d">
        <div style="max-width:520px;margin:0 auto;background:#fffaf3;border:1px solid #eadfd2;border-radius:24px;padding:28px">
          <p style="margin:0 0 16px;color:#6d5f58">Olá.</p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.1;color:#261f2d">Confirme seu e-mail</h1>
          <p style="margin:0 0 18px;line-height:1.6;color:#6d5f58">
            Use o código abaixo para liberar seu acesso ao painel do Lembraí. Ele expira em 20 minutos.
          </p>
          <div style="display:inline-block;background:#261f2d;color:#ffd7a4;border-radius:16px;padding:16px 20px;font-size:28px;font-weight:800;letter-spacing:8px">
            ${safeCode}
          </div>
          <p style="margin:22px 0 0;line-height:1.6;color:#6d5f58">
            Se você não solicitou este código, ignore este e-mail.
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendRetentionReminderEmail({
  to,
  managerName,
  eventName,
  eventSlug,
  expiresAt,
}: RetentionReminderEmailInput) {
  const eventUrl = `${getAppUrl()}/dashboard/events/${eventSlug}`;
  const formattedDate = formatDate(expiresAt);
  const greeting = managerName ? `Olá, ${escapeHtml(managerName)}.` : "Olá.";
  const safeEventName = escapeHtml(eventName);

  await sendEmail({
    to,
    subject: `Seu evento "${eventName}" expira em breve`,
    html: `
        <div style="background:#f6efe7;padding:32px;font-family:Arial,sans-serif;color:#261f2d">
          <div style="max-width:560px;margin:0 auto;background:#fffaf3;border:1px solid #eadfd2;border-radius:24px;padding:28px">
            <p style="margin:0 0 16px;color:#6d5f58">${greeting}</p>
            <h1 style="margin:0 0 16px;font-size:28px;line-height:1.1;color:#261f2d">O prazo do seu evento está acabando.</h1>
            <p style="margin:0 0 14px;line-height:1.6;color:#6d5f58">
              O evento <strong>${safeEventName}</strong> fica disponível no Lembraí até <strong>${formattedDate}</strong>.
            </p>
            <p style="margin:0 0 22px;line-height:1.6;color:#6d5f58">
              Depois desse prazo, as fotos, vídeos e dados do evento poderão ser excluídos. Acesse o painel e baixe tudo antes da data final.
            </p>
            <a href="${eventUrl}" style="display:inline-block;background:#f06f4f;color:white;text-decoration:none;font-weight:700;border-radius:14px;padding:14px 18px">
              Acessar evento
            </a>
          </div>
        </div>
      `,
  });
}
