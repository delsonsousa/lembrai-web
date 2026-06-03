import { checkAuthContext } from "@/lib/auth";
import { toProfileDto } from "@/lib/types";

export async function GET(request: Request) {
  const result = await checkAuthContext(request);

  if (!result.ok) {
    const status = result.reason === "profile_not_found" ? 403 : 401;
    return Response.json(
      {
        user: null,
        profile: null,
        code: result.reason.toUpperCase(),
      },
      { status }
    );
  }

  const { auth } = result;

  return Response.json({
    user: {
      id: auth.userId,
      email: auth.email,
    },
    profile: toProfileDto(auth.profile),
  });
}
