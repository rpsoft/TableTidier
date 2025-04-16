import { Inter } from "next/font/google";
import "./globals.css";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import Providers from '@/components/providers';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Table Tidier",
  description: "Table Tidier",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className+" container mx-auto"}>
        <Providers>
          <AntdRegistry>{children}</AntdRegistry>
        </Providers>
      </body>
    </html>
  );
}
