import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { generatePkcePair, getXeroConnectUrl } from "@/lib/xero";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", process.env.AUTH_URL ?? "http://localhost:3000"));
  }

  const state = randomBytes(16).toString("hex");
  const { verifier, challenge } = generatePkcePair();

  const cookieStore = await cookies();
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 600,
    path: "/",
  };
  cookieStore.set("xero_oauth_state", state, cookieOpts);
  cookieStore.set("xero_pkce_verifier", verifier, cookieOpts);

  return NextResponse.redirect(getXeroConnectUrl(state, challenge));
}
