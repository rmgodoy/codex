
import type {Metadata} from 'next';
import 'react-calendar/dist/Calendar.css';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { WorldProvider } from '@/components/world-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'Codex',
  description: 'Manage worlds for the Tresspasser RPG.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* latin-ext */
              @font-face {
                font-family: 'Literata';
                font-style: normal;
                font-weight: 400;
                font-display: swap;
                src: url(https://fonts.gstatic.com/s/literata/v35/o-0IIp21FLE-e6DhrgBiA2yL0hM1-i4-.woff2) format('woff2');
                unicode-range: U+0100-02AF, U+0304, U+0308, U+0329, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;
              }
              /* latin */
              @font-face {
                font-family: 'Literata';
                font-style: normal;
                font-weight: 400;
                font-display: swap;
                src: url(https://fonts.gstatic.com/s/literata/v35/o-0IIp21FLE-e6DhrgBiA2yL0hM5-g.woff2) format('woff2');
                unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
              }
            `,
          }}
        />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
            themes={['light', 'dark', 'dark-red', 'desert', 'space', 'twilight', 'chocolat', 'emerald', 'silver', 'zombie']}
          >
          <WorldProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </WorldProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
