import { requireAuth } from "@/lib/auth";
import { normalizeSlug, isValidSlug } from "@/lib/slug";
import { asEvents, getSupabaseAdmin } from "@/lib/supabase";
import { toEventDto } from "@/lib/types";

async function createEventWithGeneratedSlug({
  managerId,
  name,
}: {
  managerId: string;
  name: string;
}) {
  const baseSlug = normalizeSlug(name) || `evento-${crypto.randomUUID().slice(0, 8)}`;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    if (!isValidSlug(slug)) continue;

    const { data, error } = await getSupabaseAdmin()
      .from("events")
      .insert({
        id: crypto.randomUUID(),
        manager_id: managerId,
        name,
        slug,
        date: null,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (!error) return data;
    if (!("code" in error) || error.code !== "23505") throw error;
  }

  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
  const { data, error } = await getSupabaseAdmin()
    .from("events")
    .insert({
      id: crypto.randomUUID(),
      manager_id: managerId,
      name,
      slug,
      date: null,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function GET(request: Request) {
  const authResult = await requireAuth(request, ["event_manager"]);
  if (!authResult.ok) return authResult.response;

  const { auth } = authResult;

  const { data, error } = await getSupabaseAdmin()
    .from("events")
    .select("*")
    .eq("manager_id", auth.profile.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return Response.json({ events: asEvents(data).map(toEventDto) });
}

export async function POST(request: Request) {
  const authResult = await requireAuth(request, ["event_manager"]);
  if (!authResult.ok) return authResult.response;

  const { auth } = authResult;

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (name.length < 3) {
      return Response.json(
        { error: "Informe um nome de evento com pelo menos 3 caracteres." },
        { status: 400 }
      );
    }

    const data = await createEventWithGeneratedSlug({
      managerId: auth.profile.id,
      name,
    });

    return Response.json({ event: toEventDto(data) }, { status: 201 });
  } catch (error) {
    console.error("create dashboard event error", error);
    return Response.json(
      { error: "Não foi possível criar o evento agora." },
      { status: 500 }
    );
  }
}
