"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react'; // Import necessary functions

const AUTH0_ISSUER_BASE_URL = process.env.NEXT_PUBLIC_AUTH0_ISSUER_BASE_URL;
const AUTH0_CLIENT_ID = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function SignOut() {
    // Handle the sign out process to completely log out
    const handleSignOut = async () => {
        // Step 1: Clear the session on NextAuth side (client side)
        await signOut({ redirect: false });


        // Step 2: Redirect to Auth0 logout URL
        //
        // debugger
        const auth0LogoutUrl = `${AUTH0_ISSUER_BASE_URL}/v2/logout?client_id=${AUTH0_CLIENT_ID}&returnTo=${encodeURIComponent(NEXT_PUBLIC_APP_URL || "http://localhost:3000")}`;

        // Redirect user to Auth0 logout URL to fully clear the Auth0 session
        window.location.href = auth0LogoutUrl;
    };



    return (
        <button type="button" onClick={handleSignOut}>Sign Out</button>
    );
}

const Header = () => {
    const { data: session, status } = useSession(); // Get session data using next-auth's useSession

    // const handleForceSignIn = () => {
    //         const auth0LoginUrl = `${AUTH0_ISSUER_BASE_URL}/v2/authorize?client_id=${AUTH0_CLIENT_ID}&redirect_uri=${encodeURIComponent(NEXT_PUBLIC_APP_URL)}&response_type=code&scope=openid profile email&prompt=login`;

    //         // Redirect to Auth0 login page to force the user to log in again
    //         window.location.href = auth0LoginUrl;
    //     };

    const handleSignIn = async () => {
        // Step 1: Clear the session on NextAuth side (client side)
        await signIn("identity-server4", { callbackUrl: '/dashboard' }, { prompt: "login" })


        // Step 2: Redirect to Auth0 logout URL
        //
        // debugger
        // const auth0LogoutUrl = `${AUTH0_ISSUER_BASE_URL}/v2/logout?client_id=${AUTH0_CLIENT_ID}&returnTo=${encodeURIComponent(NEXT_PUBLIC_APP_URL || "http://localhost:3000")}`;

        // Redirect user to Auth0 logout URL to fully clear the Auth0 session
        // window.location.href = "/";
    };


    return (
        <>
        <header>
            <nav>
                <div>
                    {status === "authenticated" ? ( // Check if user is authenticated
                        <div>
                            Welcome, {session?.user?.name}!
                            <div>
                                <SignOut />
                            </div>
                            {/* Display user image if available */}
                            <Image src={session?.user?.image} alt={session?.user?.name} width={32} height={32} className='rounded-full' />
                        </div>
                    ) : (

                        <div>
                            <button type="button" onClick={handleSignIn}>Sign In</button>
                        </div>
                    )}
                </div>
            </nav>
        </header>
        </>
    );
};

export default Header;
