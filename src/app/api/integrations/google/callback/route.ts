import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { saveGoogleConnection } from "@/lib/google";

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
  const expectedState = cookieStore.get("google_oauth_state")?.value;
  cookieStore.delete("google_oauth_state");

  if (error) {
    return NextResponse.redirect(new URL(`/settings?error=google_${error}`, req.url));
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/settings?error=google_invalid_state", req.url));
  }

  try {
    await saveGoogleConnection(session.user.id, code);
  } catch {
    return NextResponse.redirect(new URL("/settings?error=google_token_exchange_failed", req.url));
  }

  return NextResponse.redirect(new URL("/settings?connected=google", req.url));
}
