import Header from "@/components/ui/header";
import { SessionProvider } from 'next-auth/react';
import Link from "next/link";

export default function Home() {
  return (
    <SessionProvider>
      <main>
        <Header />
        <h1>Home</h1>
        <Link href="/protected" > go to protected </Link>
      </main>
    </SessionProvider>
  );
}
