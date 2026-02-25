import '@/lib/fontawesome';
import './globals.css'; // Make sure path is correct
import { Inter, Cairo } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo' });

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const isAr = lang === 'ar';

  return (
    <html lang={lang} dir={isAr ? 'rtl' : 'ltr'}>
      <body className={`${isAr ? cairo.className : inter.className} antialiased bg-gray-50`}>
        {children}
      </body>
    </html>
  );
}