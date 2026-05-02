import type { Metadata } from 'next';
import { JetBrains_Mono, Inter } from 'next/font/google';
import { PipelineProvider } from '@/context/PipelineContext';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Dark Factory',
  description: 'Autonomous AI-driven software factory',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${jetbrainsMono.variable} ${inter.variable}`}>
        <PipelineProvider>{children}</PipelineProvider>
      </body>
    </html>
  );
}
