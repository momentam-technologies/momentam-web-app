/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { JWT } from "next-auth/jwt";
import NextAuth, { Session } from "next-auth"
import { SERVER_URI } from "./constants/constant";
import CredentialsProvider from "next-auth/providers/credentials";


export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "example@email.com" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        try {
          const response = await axios.post(`${SERVER_URI}/auth/login`, {
            email: credentials?.email,
            password: credentials?.password,
          });

          const { user, accessToken, refreshToken } = response.data;

          if (accessToken) {
            return {
              id: user.id,
              email: user.email,
              username: user.username,
              role: user.role,
              accessToken,
              refreshToken,
            };

          }
          return null;
        } catch (error: any) {
          console.error(error.response?.data);
          if (error.response?.data?.errors) {
            throw new Error(error.response.data.errors.join(" | "));
          }
          throw new Error(error.response?.data?.message || "Invalid credentials");
        }
      },
    }),
  ],

  pages: {
    signIn: "/auth/login", // optional custom login page
  },

  session: {
    strategy: "jwt", // we’re using stateless JWTs
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.user = {
          id: user.id as string,
          email: user.email as string,
          username: user.username as string,
          role: user.role as string,
        };
      }
      return token;
    },


    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.user) {
        session.user.id = token.user.id;
        session.user.email = token.user.email;
        session.user.username = token.user.username;
        session.user.role = token.user.role;
        session.accessToken = token.accessToken;
        session.refreshToken = token.refreshToken;
      }
      return session;
    },
  },
});