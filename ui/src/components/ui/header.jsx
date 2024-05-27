import React from 'react';
import {auth, signIn, signOut} from "@/auth";

import Image from 'next/image';
import Link from 'next/link';

function SignOut() {
    return (
        <form action={
            async () => {
                'use server';
                await signOut();
                // window.location.reload();
            }
        }>
            <button type="submit">Sign Out</button>
        </form>  
    );
}


const Header = async () => {
    const session = await auth();
    console.log(session);

    return (
        <>
        <header>
            <nav>
                <div>
                    {session ? (
                        <div>Welcome, {session?.user?.name}! <SignOut />
                        
                        <Image src= {session?.user?.image} alt={session?.user?.name} width={32} height={32} className='rounded-full'/> 
                        </div>
                    ) : 
                        <Link href="/api/auth/signin"> <button>Sign In</button> </Link>
                    }
                </div>
            </nav>            
        </header>
                
        </>
    );
};

export default Header;