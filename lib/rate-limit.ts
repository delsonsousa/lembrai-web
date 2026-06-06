type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function rateLimit(
  request: Request,
  {
    key,
    limit,
    windowMs,
  }: {
    key: string;
    limit: number;
    windowMs: number;
  }
) {
  const now = Date.now();
  const bucketKey = `${key}:${getClientIp(request)}`;
  const current = buckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { ok: true as const };
  }

  if (current.count >= limit) {
    return {
      ok: false as const,
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;
  return { ok: true as const };
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return Response.json(
    { error: "Muitas tentativas. Aguarde um pouco e tente novamente." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}
