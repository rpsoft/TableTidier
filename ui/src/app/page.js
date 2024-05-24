import Header from "@/components/ui/header";
import Image from "next/image";
import { SessionProvider } from 'next-auth/react';


export default function Home() {
  return (
    <SessionProvider>
      <main>
        <Header />
        <h1>Home</h1>
      </main>
    </SessionProvider>
  );
}
