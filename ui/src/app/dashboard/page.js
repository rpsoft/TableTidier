import Header from "@/components/ui/header";
import { SessionProvider } from 'next-auth/react';
import Link from "next/link";

export default function Dashboard() {
  return (
    <SessionProvider>
      <main>
        <Header />


        <div className="flex mt-4">
            <Link
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
                href="/table"
            >
                Go to tables
            </Link>
        </div>


      </main>
    </SessionProvider>
  );
}
