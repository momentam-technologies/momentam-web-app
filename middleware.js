import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    const { pathname } = req.nextUrl;

    // console.log("Middleware - Token:", token.accessToken);

    // If user is logged in and tries to visit auth pages, redirect to home
    if (token && (pathname === "/login")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    const protectedPaths = ["/dashboard"]; // add other protected routes here

    // If user is not logged in and tries to access protected pages, redirect to login
    if (!token && protectedPaths.some((path) => pathname.startsWith(path))) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard:path*", "/login"], // routes to run middleware on
};