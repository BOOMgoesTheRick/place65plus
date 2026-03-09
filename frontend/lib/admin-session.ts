import { createHash } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const COOKIE_NAME = "p65_admin";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function computeToken(): string {
  return createHash("sha256")
    .update(`${process.env.ADMIN_SECRET ?? ""}:place65admin:v1`)
    .digest("hex");
}

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value === computeToken();
}

export async function requireAuth(): Promise<void> {
  if (!(await isAuthenticated())) redirect("/admin/login");
}
