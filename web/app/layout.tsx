import './globals.css';
import { Inter, Roboto_Mono } from 'next/font/google';
import { Providers } from './providers';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
});

export const metadata = {
  title: 'GangGPT - AI-Powered GTA V Roleplay',
  description: 'Experience the most immersive AI-powered Grand Theft Auto V multiplayer server with intelligent NPCs, dynamic factions, and procedural missions.',
  keywords: 'GTA V, roleplay, AI, multiplayer, gaming, NPCs, factions',
  openGraph: {
    title: 'GangGPT - AI-Powered GTA V Roleplay',
    description: 'Experience the most immersive AI-powered Grand Theft Auto V multiplayer server.',
    type: 'website',
    locale: 'en_US',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${robotoMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
