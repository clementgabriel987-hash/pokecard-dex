import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

// 1. On charge uniquement ta police Figma (Outfit)
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

// 2. On garde tes métadonnées intactes
export const metadata: Metadata = {
  title: "Mon Classeur Pokémon en Ligne",
  description: "Créé par le Gabrioul",
};

// 3. Un seul RootLayout qui englobe tout ton site
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      // On injecte la variable de la police ici
      className={`${outfit.variable} h-full antialiased`}
    >
      {/* On applique le fond sombre et on dit au body d'utiliser la police */}
      <body className="min-h-full flex flex-col font-sans bg-[#09090B] text-white">
        {children}
      </body>
    </html>
  );
}