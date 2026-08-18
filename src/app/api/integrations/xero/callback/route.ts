import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { saveXeroConnection } from "@/lib/xero";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("xero_oauth_state")?.value;
  const codeVerifier = cookieStore.get("xero_pkce_verifier")?.value;
  cookieStore.delete("xero_oauth_state");
  cookieStore.delete("xero_pkce_verifier");

  if (error) {
    return NextResponse.redirect(new URL(`/settings?error=xero_${error}`, req.url));
  }
  if (!code || !state || !expectedState || state !== expectedState || !codeVerifier) {
    return NextResponse.redirect(new URL("/settings?error=xero_invalid_state", req.url));
  }

  try {
    await saveXeroConnection(session.user.id, code, codeVerifier);
  } catch (err) {
    console.error("[xero:callback]", err);
    return NextResponse.redirect(new URL("/settings?error=xero_token_exchange_failed", req.url));
  }

  return NextResponse.redirect(new URL("/settings?connected=xero", req.url));
}
