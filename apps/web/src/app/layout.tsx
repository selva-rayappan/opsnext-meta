import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    template: '%s | OpsNext CRM',
    default: 'OpsNext CRM',
  },
  description:
    'OpsNext CRM — the production-ready multi-tenant SaaS CRM for modern sales teams.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
