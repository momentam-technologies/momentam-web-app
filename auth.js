/* eslint-disable no-unused-vars */
import axios from "axios";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { SERVER_URI } from "./constants/constant.js";

const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text", placeholder: "example@email.com" },
                password: { label: "Password", type: "password" },
            },

            async authorize(credentials) {
                try {
                    const response = await axios.post(`${SERVER_URI}/admin/login`, {
                        email: credentials?.email,
                        password: credentials?.password,
                    });

                    const { user, token } = response.data;

                    if (token && user) {
                        return {
                            id: user.id,
                            email: user.email,
                            role: user.role,
                            accessToken: token,
                        };
                    }
                    // Failed login → return null
                    return null;
                } catch (error) {
                    console.error(error.response?.data);

                    if (error.response?.status >= 400 && error.response?.status < 500) {
                        return null;
                    }
                    // Unexpected server errors
                    throw new Error("Server error");
                }
            }
        }),
    ],

    pages: {
        signIn: "/login",
    },

    session: {
        strategy: "jwt",
    },

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.accessToken = user.accessToken;
                token.user = {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                };
            }
            return token;
        },

        async session({ session, token }) {
            if (token.user) {
                session.user = token.user;
                session.accessToken = token.accessToken;
            }
            return session;
        },
    },
};


export default NextAuth(authOptions);