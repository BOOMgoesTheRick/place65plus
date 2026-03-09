"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { computeToken, COOKIE_NAME, COOKIE_MAX_AGE, isAuthenticated } from "@/lib/admin-session";

function getSb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

async function assertAuth() {
  if (!(await isAuthenticated())) redirect("/admin/login");
}

export async function loginAction(formData: FormData) {
  const pw = formData.get("password") as string;
  if (pw !== process.env.ADMIN_SECRET) redirect("/admin/login?error=1");
  (await cookies()).set(COOKIE_NAME, computeToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  redirect("/admin");
}

export async function logoutAction() {
  (await cookies()).delete(COOKIE_NAME);
  redirect("/admin/login");
}

export async function deleteResidenceAction(formData: FormData) {
  await assertAuth();
  const id = parseInt(formData.get("id") as string);
  const returnTo = (formData.get("returnTo") as string) || "/admin/residences";
  await getSb().from("residences").delete().eq("id", id);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}deleted=${id}`);
}

export async function bulkDeleteAction(formData: FormData) {
  await assertAuth();
  const ids = (formData.get("ids") as string)
    .split(",")
    .map(Number)
    .filter(Boolean);
  if (ids.length === 0) redirect("/admin/cleanup");
  const sb = getSb();
  const BATCH = 100;
  for (let i = 0; i < ids.length; i += BATCH) {
    await sb.from("residences").delete().in("id", ids.slice(i, i + BATCH));
  }
  redirect(`/admin/cleanup?deleted=${ids.length}`);
}

export async function markReviewedAction(formData: FormData) {
  await assertAuth();
  const id = parseInt(formData.get("id") as string);
  const returnTo = (formData.get("returnTo") as string) || "/admin/cleanup";
  await getSb().from("residences").update({ is_reviewed: true }).eq("id", id);
  redirect(returnTo);
}

export async function updateResidenceAction(formData: FormData) {
  await assertAuth();
  const id = parseInt(formData.get("id") as string);
  const update: Record<string, string | null> = {
    nom: formData.get("nom") as string,
    ville: formData.get("ville") as string,
    region: formData.get("region") as string,
    telephone: (formData.get("telephone") as string) || null,
    site_web: (formData.get("site_web") as string) || null,
    adresse: (formData.get("adresse") as string) || null,
  };
  await getSb().from("residences").update(update).eq("id", id);
  redirect(`/admin/residence/${id}?saved=1`);
}
