import { checkAuthContext, getManagerAccessStatus, isManagerRole } from "@/lib/auth";
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
  let access = null;

  if (isManagerRole(auth.profile.role)) {
    try {
      access = await getManagerAccessStatus(auth);
    } catch (error) {
      console.error("auth access check error", error);
      return Response.json(
        {
          user: {
            id: auth.userId,
            email: auth.email,
          },
          profile: toProfileDto(auth.profile),
          code: "ACCESS_CHECK_FAILED",
        },
        { status: 500 }
      );
    }
  }

  return Response.json({
    user: {
      id: auth.userId,
      email: auth.email,
    },
    profile: toProfileDto(auth.profile),
    onboarding:
      access && !access.ok
        ? {
            complete: false,
            reason: access.reason,
            redirectTo: access.redirectTo,
          }
        : { complete: true },
  });
}
