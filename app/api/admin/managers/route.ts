import { requireAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { toProfileDto } from "@/lib/types";

export async function POST(request: Request) {
  const authResult = await requireAuth(request, ["platform_admin"]);
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name || !email || password.length < 6) {
      return Response.json(
        {
          error:
            "Informe nome, e-mail e senha com pelo menos 6 caracteres.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: "event_manager",
      },
    });

    if (userError || !userData.user) throw userError;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userData.user.id,
        name,
        email,
        role: "event_manager",
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (profileError) throw profileError;

    return Response.json(
      {
        manager: toProfileDto(profile),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("create manager error", error);
    return Response.json(
      { error: "Não foi possível criar o gestor." },
      { status: 500 }
    );
  }
}
