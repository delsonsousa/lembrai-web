import { requireAuth } from "@/lib/auth";
import { asEvents, asProfiles, getSupabaseAdmin } from "@/lib/supabase";
import { toEventDto, toProfileDto } from "@/lib/types";

export async function GET(request: Request) {
  const authResult = await requireAuth(request, ["platform_admin"]);
  if (!authResult.ok) return authResult.response;

  const supabase = getSupabaseAdmin();

  const [profiles, events] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("events").select("*").order("created_at", { ascending: false }),
  ]);

  if (profiles.error) throw profiles.error;
  if (events.error) throw events.error;

  return Response.json({
    managers: asProfiles(profiles.data).map(toProfileDto),
    events: asEvents(events.data).map(toEventDto),
  });
}
