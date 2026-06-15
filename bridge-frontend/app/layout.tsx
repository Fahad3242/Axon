import type { Metadata } from 'next';
import { Inter, Playfair_Display, Barlow_Condensed } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-editorial', style: 'italic' });
const barlow = Barlow_Condensed({ subsets: ['latin'], variable: '--font-monument', weight: '800' });

export const metadata: Metadata = {
  title: "Axon — Cross-Chain Bridge",
  description: "Bridge assets across chains. Fast. Secure. Trustless.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${barlow.variable} bg-[#08080F]`}
    >
      <body className="antialiased bg-[#08080F] text-white min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
