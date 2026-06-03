import { getSupabaseAdmin } from "@/lib/supabase";
import { toProfileDto } from "@/lib/types";

type SetupStatus = {
  enabled: boolean;
  hasPlatformAdmin: boolean;
  schemaReady: boolean;
  canRunDatabaseSetup: boolean;
  diagnostic?: "schema_missing";
};

function isSchemaMissing(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const candidate = error as { code?: string; message?: string };
  return (
    candidate.code === "42P01" ||
    candidate.code === "PGRST205" ||
    Boolean(candidate.message?.includes("public.profiles"))
  );
}

async function hasPlatformAdmin() {
  const { data, error } = await getSupabaseAdmin()
    .from("profiles")
    .select("id")
    .eq("role", "platform_admin")
    .limit(1);

  if (error) throw error;
  return Boolean(data?.length);
}

async function getSetupStatus(): Promise<SetupStatus> {
  try {
    return {
      enabled: Boolean(process.env.BOOTSTRAP_ADMIN_SECRET),
      hasPlatformAdmin: await hasPlatformAdmin(),
      schemaReady: true,
      canRunDatabaseSetup: Boolean(process.env.SUPABASE_DB_URL),
    };
  } catch (error) {
    if (!isSchemaMissing(error)) throw error;

    return {
      enabled: Boolean(process.env.BOOTSTRAP_ADMIN_SECRET),
      hasPlatformAdmin: false,
      schemaReady: false,
      canRunDatabaseSetup: Boolean(process.env.SUPABASE_DB_URL),
      diagnostic: "schema_missing",
    };
  }
}

async function findAuthUserByEmail(email: string) {
  const normalizedEmail = email.toLowerCase();
  let page = 1;

  while (page <= 10) {
    const { data, error } = await getSupabaseAdmin().auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) throw error;

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === normalizedEmail
    );
    if (user) return user;
    if (data.users.length < 100) return null;

    page += 1;
  }

  return null;
}

export async function GET() {
  try {
    return Response.json(await getSetupStatus());
  } catch (error) {
    console.error("setup status error", error);
    return Response.json(
      { error: "Não foi possível verificar o bootstrap." },
      { status: 500 }
    );
  }
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

    const status = await getSetupStatus();
    if (!status.schemaReady) {
      return Response.json(
        { error: "Configure o banco antes de criar o admin inicial." },
        { status: 428 }
      );
    }

    if (await hasPlatformAdmin()) {
      return Response.json(
        { error: "Já existe um platform_admin. Bootstrap bloqueado." },
        { status: 409 }
      );
    }

    const body = await request.json();
    const secret = typeof body.secret === "string" ? body.secret : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (secret !== expectedSecret) {
      return Response.json({ error: "Segredo inválido." }, { status: 401 });
    }

    if (!name || !email || password.length < 6) {
      return Response.json(
        { error: "Informe nome, e-mail e senha com pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const existingUser = await findAuthUserByEmail(email);
    let userId = existingUser?.id;

    if (!userId) {
      const { data: userData, error: userError } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            name,
            role: "platform_admin",
          },
        });

      if (userError || !userData.user) throw userError;
      userId = userData.user.id;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          name,
          email,
          role: "platform_admin",
          created_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select("*")
      .single();

    if (profileError) throw profileError;

    return Response.json({ profile: toProfileDto(profile) }, { status: 201 });
  } catch (error) {
    console.error("bootstrap admin error", error);
    return Response.json(
      { error: "Não foi possível criar o admin inicial." },
      { status: 500 }
    );
  }
}
