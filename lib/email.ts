import { Resend } from "resend";

type VerificationCodeEmailInput = {
  to: string;
  code: string;
};

type PasswordResetEmailInput = {
  to: string;
  name: string | null;
  resetUrl: string;
  expiresInMinutes: number;
};

type WelcomeEmailInput = {
  to: string;
  name: string | null;
};

type ProfileUpdatedEmailInput = {
  to: string;
  name: string | null;
  changedFields: string[];
  accountPath?: "/account" | "/admin";
};

type EventCreatedEmailInput = {
  to: string;
  managerName: string | null;
  eventName: string;
  eventSlug: string;
  eventDate: string;
  expiresAt: string | null;
};

type RetentionReminderEmailInput = {
  to: string;
  managerName: string | null;
  eventName: string;
  eventSlug: string;
  expiresAt: string;
  daysRemaining?: number;
};

type AccountExpirationEmailInput = {
  to: string;
  managerName: string | null;
  planName: string;
  expiresAt: string;
  daysRemaining?: number;
};

let resendClient: Resend | null = null;

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

function getEmailFrom() {
  return process.env.EMAIL_FROM ?? "Lembraí <onboarding@resend.dev>";
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

function emailShell(content: string) {
  return `
    <div style="background:#f6efe7;padding:32px;font-family:Arial,sans-serif;color:#261f2d">
      <div style="max-width:560px;margin:0 auto;background:#fffaf3;border:1px solid #eadfd2;border-radius:24px;padding:28px">
        ${content}
      </div>
    </div>
  `;
}

function cta(label: string, href: string) {
  return `
    <a href="${href}" style="display:inline-block;background:#f06f4f;color:white;text-decoration:none;font-weight:700;border-radius:14px;padding:14px 18px">
      ${escapeHtml(label)}
    </a>
  `;
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
  const resend = getResend();

  if (!resend) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[Lembraí] E-mail não enviado em dev: ${subject} -> ${to}`);
      return;
    }

    throw new Error("RESEND_API_KEY is not configured");
  }

  const { error } = await resend.emails.send({
    from: getEmailFrom(),
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend failed: ${error.message}`);
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
    html: emailShell(`
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
    `),
  });
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
  expiresInMinutes,
}: PasswordResetEmailInput) {
  const greeting = name ? `Olá, ${escapeHtml(name)}.` : "Olá.";

  await sendEmail({
    to,
    subject: "Redefina sua senha do Lembraí",
    html: emailShell(`
      <p style="margin:0 0 16px;color:#6d5f58">${greeting}</p>
      <h1 style="margin:0 0 16px;font-size:28px;line-height:1.1;color:#261f2d">Recebemos uma solicitação para redefinir sua senha.</h1>
      <p style="margin:0 0 22px;line-height:1.6;color:#6d5f58">
        Clique no botão abaixo para criar uma nova senha. Este link expira em ${expiresInMinutes} minutos.
      </p>
      ${cta("Redefinir senha", resetUrl)}
      <p style="margin:22px 0 0;line-height:1.6;color:#6d5f58">
        Se você não pediu essa alteração, ignore este e-mail. Sua senha atual continuará válida.
      </p>
    `),
  });
}

export async function sendWelcomeEmail({ to, name }: WelcomeEmailInput) {
  const dashboardUrl = `${getAppUrl()}/dashboard`;
  const greeting = name ? `Olá, ${escapeHtml(name)}.` : "Olá.";

  await sendEmail({
    to,
    subject: "Bem-vindo ao Lembraí",
    html: emailShell(`
      <p style="margin:0 0 16px;color:#6d5f58">${greeting}</p>
      <h1 style="margin:0 0 16px;font-size:28px;line-height:1.1;color:#261f2d">Seu acesso está pronto.</h1>
      <p style="margin:0 0 22px;line-height:1.6;color:#6d5f58">
        Agora você pode criar eventos, gerar QR Codes e receber fotos e vídeos dos convidados em um álbum privado.
      </p>
      ${cta("Abrir painel", dashboardUrl)}
    `),
  });
}

export async function sendProfileUpdatedEmail({
  to,
  name,
  changedFields,
  accountPath = "/account",
}: ProfileUpdatedEmailInput) {
  const accountUrl = `${getAppUrl()}${accountPath}`;
  const greeting = name ? `Olá, ${escapeHtml(name)}.` : "Olá.";
  const safeFields = changedFields.map(escapeHtml).join(", ");

  await sendEmail({
    to,
    subject: "Dados da sua conta Lembraí foram atualizados",
    html: emailShell(`
      <p style="margin:0 0 16px;color:#6d5f58">${greeting}</p>
      <h1 style="margin:0 0 16px;font-size:28px;line-height:1.1;color:#261f2d">Alteração registrada na sua conta.</h1>
      <p style="margin:0 0 14px;line-height:1.6;color:#6d5f58">
        Os seguintes dados foram atualizados: <strong>${safeFields || "dados do perfil"}</strong>.
      </p>
      <p style="margin:0 0 22px;line-height:1.6;color:#6d5f58">
        Se você não fez essa alteração, troque sua senha e entre em contato com o suporte.
      </p>
      ${cta("Abrir conta", accountUrl)}
    `),
  });
}

export async function sendEventCreatedEmail({
  to,
  managerName,
  eventName,
  eventSlug,
  eventDate,
  expiresAt,
}: EventCreatedEmailInput) {
  const eventUrl = `${getAppUrl()}/dashboard/events/${eventSlug}`;
  const greeting = managerName ? `Olá, ${escapeHtml(managerName)}.` : "Olá.";
  const safeEventName = escapeHtml(eventName);

  await sendEmail({
    to,
    subject: `Evento "${eventName}" criado no Lembraí`,
    html: emailShell(`
      <p style="margin:0 0 16px;color:#6d5f58">${greeting}</p>
      <h1 style="margin:0 0 16px;font-size:28px;line-height:1.1;color:#261f2d">Seu evento foi criado.</h1>
      <p style="margin:0 0 14px;line-height:1.6;color:#6d5f58">
        O evento <strong>${safeEventName}</strong>, em <strong>${formatDate(eventDate)}</strong>, já tem painel e QR Code disponíveis.
      </p>
      ${
        expiresAt
          ? `<p style="margin:0 0 22px;line-height:1.6;color:#6d5f58">O armazenamento fica disponível até <strong>${formatDate(expiresAt)}</strong>.</p>`
          : ""
      }
      ${cta("Abrir evento", eventUrl)}
    `),
  });
}

export async function sendRetentionReminderEmail({
  to,
  managerName,
  eventName,
  eventSlug,
  expiresAt,
  daysRemaining,
}: RetentionReminderEmailInput) {
  const eventUrl = `${getAppUrl()}/dashboard/events/${eventSlug}`;
  const formattedDate = formatDate(expiresAt);
  const greeting = managerName ? `Olá, ${escapeHtml(managerName)}.` : "Olá.";
  const safeEventName = escapeHtml(eventName);
  const remainingText =
    typeof daysRemaining === "number"
      ? `Faltam ${daysRemaining} dia(s).`
      : "O prazo está chegando.";

  await sendEmail({
    to,
    subject: `Seu evento "${eventName}" expira em breve`,
    html: emailShell(`
      <p style="margin:0 0 16px;color:#6d5f58">${greeting}</p>
      <h1 style="margin:0 0 16px;font-size:28px;line-height:1.1;color:#261f2d">O prazo do seu evento está acabando.</h1>
      <p style="margin:0 0 14px;line-height:1.6;color:#6d5f58">
        O evento <strong>${safeEventName}</strong> fica disponível no Lembraí até <strong>${formattedDate}</strong>. ${remainingText}
      </p>
      <p style="margin:0 0 22px;line-height:1.6;color:#6d5f58">
        Depois desse prazo, as fotos, vídeos e dados do evento poderão ser excluídos. Acesse o painel e baixe tudo antes da data final.
      </p>
      ${cta("Acessar evento", eventUrl)}
    `),
  });
}

export async function sendAccountExpirationEmail({
  to,
  managerName,
  planName,
  expiresAt,
  daysRemaining,
}: AccountExpirationEmailInput) {
  const checkoutUrl = `${getAppUrl()}/checkout`;
  const greeting = managerName ? `Olá, ${escapeHtml(managerName)}.` : "Olá.";
  const safePlanName = escapeHtml(planName);
  const remainingText =
    typeof daysRemaining === "number"
      ? `faltam ${daysRemaining} dia(s)`
      : "o prazo está chegando";

  await sendEmail({
    to,
    subject: "Seu acesso Lembraí expira em breve",
    html: emailShell(`
      <p style="margin:0 0 16px;color:#6d5f58">${greeting}</p>
      <h1 style="margin:0 0 16px;font-size:28px;line-height:1.1;color:#261f2d">Seu acesso está perto de expirar.</h1>
      <p style="margin:0 0 14px;line-height:1.6;color:#6d5f58">
        Para o plano <strong>${safePlanName}</strong>, ${remainingText}. A data final é <strong>${formatDate(expiresAt)}</strong>.
      </p>
      <p style="margin:0 0 22px;line-height:1.6;color:#6d5f58">
        Renove o acesso para continuar criando eventos e gerenciando seus álbuns.
      </p>
      ${cta("Renovar acesso", checkoutUrl)}
    `),
  });
}
