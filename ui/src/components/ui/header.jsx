"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react'; // Import necessary functions

const AUTH0_ISSUER_BASE_URL = process.env.NEXT_PUBLIC_AUTH0_ISSUER_BASE_URL;
const AUTH0_CLIENT_ID = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function SignOut() {
    const handleSignOut = async () => {
        try {
            // Sign out from NextAuth
            await signOut({ 
                redirect: false,
                callbackUrl: '/'
            });
            
            // Clear any remaining session data
            window.location.href = '/';
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    return (
        <button type="button" className='btn btn-primary' onClick={handleSignOut}>Sign Out</button>
    );
}

const Header = () => {
    const { data: session, status } = useSession(); // Get session data using next-auth's useSession

    const handleSignIn = async () => {
        try {
            await signIn("google", { 
                callbackUrl: '/',
                prompt: "select_account"
            });
        } catch (error) {
            console.error('Sign in error:', error);
        }
    };

    return (
        <>
        <header className="bg-blue-900 p-2" >
            <nav>
            	<div className="flex w-full">

	                <div className="flex justify-between w-full ">
						<div className='self-center text-md font-bold mx-2'><Link className='no-underline' href='/'>TableTidier</Link></div>
	                    {status === "authenticated" ? ( // Check if user is authenticated
                            <div className='flex items-center'>
	                            <Image src={session?.user?.image || "/next.svg"} alt={session?.user?.name} width={32} height={32} className='border-2 rounded-full h-8 w-8 bg-white mx-2' />
								<SignOut />
                            </div>

	                    ) : (

	                        <div>
	                            <button type="btn" className="btn btn-primary" onClick={handleSignIn}>Sign In</button>
	                        </div>
	                    )}
	                </div>
	             </div>
            </nav>
        </header>
        </>
    );
};

export default Header;
