export function publicIdFromUserId(userId: string) {
  return userId.replaceAll("-", "").slice(0, 10).toLowerCase();
}
