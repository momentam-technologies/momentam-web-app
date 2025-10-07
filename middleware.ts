import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    const { pathname } = req.nextUrl;

    // console.log("Middleware - Token:", token);

    // If user is logged in and tries to visit auth pages, redirect to home
    if (token && (pathname === "/auth/login" || pathname === "/auth/register")) {
        return NextResponse.redirect(new URL("/home", req.url));
    }

    const protectedPaths = ["/home"]; // add other protected routes here

    // If user is not logged in and tries to access protected pages, redirect to login
    if (!token && protectedPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/home:path*", "/auth/login", "/auth/register"], // routes to run middleware on
};