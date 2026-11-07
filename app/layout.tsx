import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
import type { Metadata } from 'next';
import { config } from '@/app/lib/config';

export const metadata: Metadata = {
  title: `${config.appNom} | ${config.collectiviteNom}`,
  description: `Proposez et votez pour les idées qui améliorent ${config.collectiviteNom}.`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
