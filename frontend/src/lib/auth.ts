import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@test.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Mock authentication
        if (!credentials?.email || !credentials?.password) return null;

        if (credentials.email === "admin@test.com" && credentials.password === "password") {
          return { id: "1", name: "Admin User", email: "admin@test.com", role: "admin" };
        }

        if (credentials.email === "user@test.com" && credentials.password === "password") {
          return { id: "2", name: "Standard User", email: "user@test.com", role: "user" };
        }

        return null;
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
