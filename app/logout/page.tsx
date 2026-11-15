import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function LogoutPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("nexus_token")?.value;

  if (token) {
    try {
      const { getDb } = await import("@/lib/db");
      const db = getDb();
      db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
      const { NextResponse } = await import("next/server");
      const res = NextResponse.redirect(
        new URL("/login", process.env.NEXTAUTH_URL || "http://localhost:3000")
      );
      res.cookies.set("nexus_token", "", {
        httpOnly: true,
        path: "/",
        maxAge: 0,
      });
      return res;
    } catch {}
  }

  redirect("/login");
}
