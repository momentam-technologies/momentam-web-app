import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string; // include id for TS safety
            email: string;
            username: string;
            role: string;
        } & DefaultSession["user"];
        accessToken?: string;
        refreshToken?: string;
    }

    interface User extends DefaultUser {
        id: string;
        username: string;
        role: string;
        accessToken?: string;
        refreshToken?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string;
        refreshToken?: string;
        user?: {
            id: string;
            email: string;
            username: string;
            role: string;
        };
    }
}