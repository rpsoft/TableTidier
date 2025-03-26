'use server';

import {auth, signIn, signOut} from "@/auth";

const signOutAction = async () => {
    await signOut({
        redirect: false,
    });

    // Redirect user to Auth0 logout URL
    // const auth0LogoutUrl = `${process.env.AUTH0_ISSUER_BASE_URL}/v2/logout?client_id=${process.env.AUTH0_CLIENT_ID}&returnTo=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")}`;

    // return `${process.env.AUTH0_ISSUER_BASE_URL}/v2/logout?client_id=${process.env.AUTH0_CLIENT_ID}&returnTo=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")}`;
}

export default signOutAction;

export { signOutAction };
