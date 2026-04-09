import { NextRequest, NextResponse } from "next/server";

const ADMIN_ONLY_PATHS = ["/admin/categories", "/admin/users"];

const redirectToLogin = (req: NextRequest) => {
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
};

const redirectToHome = (req: NextRequest) => NextResponse.redirect(new URL("/", req.url));

export async function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;
  if (!token) {
    return redirectToLogin(req);
  }

  let response: Response;
  try {
    response = await fetch(new URL("/api/auth/me", req.url), {
      headers: {
        cookie: req.headers.get("cookie") ?? ""
      },
      cache: "no-store"
    });
  } catch {
    return redirectToLogin(req);
  }

  if (!response.ok) {
    return redirectToLogin(req);
  }

  const json = (await response.json()) as {
    data?: { user?: { role?: string } };
  };
  const role = json.data?.user?.role;
  const isAdmin = role === "admin";
  const isModerator = role === "moderator";

  if (!isAdmin && !isModerator) {
    return redirectToHome(req);
  }

  if (ADMIN_ONLY_PATHS.some((path) => req.nextUrl.pathname.startsWith(path)) && !isAdmin) {
    return redirectToHome(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
