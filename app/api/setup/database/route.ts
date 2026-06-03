import { runDatabaseSetup } from "@/lib/setup-database";

export const runtime = "nodejs";

function getDatabaseSetupMessage(error: unknown) {
  if (
    error instanceof Error &&
    error.message === "SUPABASE_DB_URL is not configured"
  ) {
    return "Configure SUPABASE_DB_URL no .env.local.";
  }

  if (error instanceof Error && error.message === "LEGACY_SCHEMA_HAS_DATA") {
    return "Existe um schema antigo com dados. Faça backup ou migração manual antes do bootstrap automático.";
  }

  if (!error || typeof error !== "object") {
    return "Não foi possível configurar o banco automaticamente.";
  }

  const candidate = error as { code?: string; message?: string };

  if (candidate.code === "ENOTFOUND") {
    return "Host do SUPABASE_DB_URL não encontrado. Use a connection string do pooler no botão Connect do Supabase.";
  }

  if (candidate.code === "ECONNREFUSED" || candidate.code === "ETIMEDOUT") {
    return "Não foi possível conectar no SUPABASE_DB_URL. Confira host, porta e rede.";
  }

  if (candidate.code === "28P01") {
    return "Senha do banco inválida no SUPABASE_DB_URL.";
  }

  if (candidate.message?.includes("Tenant or user not found")) {
    return "Usuário/tenant do pooler não encontrado. Copie novamente a connection string pelo botão Connect do projeto correto.";
  }

  return "Não foi possível configurar o banco automaticamente.";
}

export async function POST(request: Request) {
  try {
    const expectedSecret = process.env.BOOTSTRAP_ADMIN_SECRET;
    if (!expectedSecret) {
      return Response.json(
        { error: "Configure BOOTSTRAP_ADMIN_SECRET no .env.local." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const secret = typeof body.secret === "string" ? body.secret : "";

    if (secret !== expectedSecret) {
      return Response.json({ error: "Segredo inválido." }, { status: 401 });
    }

    await runDatabaseSetup();

    return Response.json({ ok: true });
  } catch (error) {
    console.error("database setup error", error);

    return Response.json(
      { error: getDatabaseSetupMessage(error) },
      { status: 500 }
    );
  }
}
