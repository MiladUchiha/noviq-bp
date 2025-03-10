import { getServerSession } from "next-auth";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Noviq - AI Business Advisor",
  description: "Get instant feedback on your business ideas",
};

async function RootLayout({ children }) {
  const session = await getServerSession();

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}

export default RootLayout;
