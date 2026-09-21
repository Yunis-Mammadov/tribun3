import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "Tribün | Futbol Bilgi Yarışmaları",
    template: "%s | Tribün",
  },

  description:
    "Futbol bilgini test et, takımın için yarış ve diğer taraftarlarla rekabet et.",

  applicationName: "Tribün",

  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Tribün",
    title: "Tribün | Futbol Bilgi Yarışmaları",
    description:
      "Futbol bilgini test et, takımın için yarış ve diğer taraftarlarla rekabet et.",
    url: "/",
  },

  twitter: {
    card: "summary_large_image",
    title: "Tribün | Futbol Bilgi Yarışmaları",
    description:
      "Futbol bilgini test et, takımın için yarış ve diğer taraftarlarla rekabet et.",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>
        <header className="border-b border-zinc-800">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
            <Link href="/" className="text-2xl font-black">
              TRİBÜN
            </Link>

            <nav>
              <Link
                href="/oyunlar"
                className="font-medium text-zinc-300 hover:text-white"
              >
                Oyunlar
              </Link>
            </nav>
          </div>
        </header>

        {children}

        <footer className="mt-20 border-t border-zinc-800">
          <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-zinc-500">
            © Tribün
          </div>
        </footer>
      </body>
    </html>
  );
}