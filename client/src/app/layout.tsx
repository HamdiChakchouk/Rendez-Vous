import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Reservy | Réservation Salon de Beauté en Tunisie",
  description: "Réservez vos soins de beauté en Tunisie en moins d'une minute avec Reservy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased font-sans bg-slate-50 text-slate-900">
        <AuthProvider>
          <main className="max-w-xl mx-auto min-h-screen bg-white shadow-2xl shadow-slate-200">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
