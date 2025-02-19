'use server';

import {auth, signIn, signOut} from "@/auth";

const signOutAction = async () => {
    await signOut();
}

export default signOutAction;

export { signOutAction };
