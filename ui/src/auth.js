import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import Auth0Provider from "next-auth/providers/auth0";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
            params: {
            	prompt: "login", // Force re-authentication
            },
        },
    }),
    Auth0Provider({
		clientId: process.env.AUTH0_CLIENT_ID,
		clientSecret: process.env.AUTH0_CLIENT_SECRET,
		issuer: process.env.AUTH0_ISSUER_BASE_URL,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET, // Ensure this is set
  debug: process.env.NODE_ENV === "development", // Optional debugging
  // callbacks: [
  //     session({ session, token }) {
  //         debugger
  //         session.user.role = token.role
  //         return session
  //     }
  // },
});
