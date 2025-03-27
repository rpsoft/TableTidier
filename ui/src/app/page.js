"use client"
import Header from "@/components/ui/header";
import { SessionProvider } from 'next-auth/react';
import Link from "next/link";


import { useSession } from 'next-auth/react';


function Content() {

	const session = useSession();

		if (!session.data) {
			return (
				<div className="text-center">
					<h1 className="mb-4">Welcome to TableTidier</h1>
					<p>TableTidier is a web application that helps with extracting data from your tables.</p>
				</div>
			);
		}

		return (
			<div className="text-center">
				<h1 className="mb-4">You are logged in: { session.data?.user?.name }</h1>
				<p>Click below to start</p>
				<Link href="/table" className="mt-4 inline-block px-6 py-2 text-white bg-blue-500 rounded hover:bg-blue-700">Tables Dashboard</Link>
			</div>
		);

}


export default function Home() {

  return (
    <SessionProvider>
      <main>
        <Header />

        <div className="flex flex-col items-center justify-center p-10">
        	<div><Content /></div>
        </div>

      </main>
    </SessionProvider>
  );
}
