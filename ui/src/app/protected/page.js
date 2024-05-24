
import React from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { auth } from "@/auth";


const Page = async () => {

    const session = await auth();

    console.log(session)

    return (
        <SessionProvider session={session} refetchInterval={5 * 60}>
            { session ? <div>{session?.user.name + ' SECRET HERE! '}</div> : <div>Nothing here</div>}
            </SessionProvider>
    );
};

export default Page;