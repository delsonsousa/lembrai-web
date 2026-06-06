import { requireAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authResult = await requireAuth(request, ["manager"]);
  if (!authResult.ok) return authResult.response;

  try {
    const now = new Date().toISOString();
    const { error } = await getSupabaseAdmin()
      .from("profiles")
      .update({
        terms_accepted_at: now,
        updated_at: now,
      })
      .eq("id", authResult.auth.profile.id);

    if (error) throw error;

    return Response.json({ ok: true });
  } catch (error) {
    console.error("accept terms error", error);
    return Response.json(
      { error: "Não foi possível registrar o aceite agora." },
      { status: 500 }
    );
  }
}
