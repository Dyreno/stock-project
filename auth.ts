
import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
      issuer: "https://discord.com",
    }),
  ],

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 60*60,
    updateAge: 0,
  },

  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === "discord") {
        token.discordId = account.providerAccountId;
      }

      return token;
    },

    async session({ session, token }) {
      if (typeof token.discordId === "string") {
        session.user.discordId = token.discordId;
      }

      return session;
    },
  },

  debug: process.env.NODE_ENV === "development",
});
