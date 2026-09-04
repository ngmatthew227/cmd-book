import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  if (
    (pathname.startsWith("/api/commands") ||
      pathname.startsWith("/api/tasks") ||
      pathname.startsWith("/api/folders")) &&
    !isLoggedIn
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    (pathname.startsWith("/library") || pathname.startsWith("/tasks")) &&
    !isLoggedIn
  ) {
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if ((pathname === "/login" || pathname === "/register") && isLoggedIn) {
    return NextResponse.redirect(new URL("/library", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/library/:path*",
    "/tasks/:path*",
    "/api/commands/:path*",
    "/api/tasks/:path*",
    "/api/folders/:path*",
    "/login",
    "/register",
  ],
};
