import { getDictionary } from '@/lib/get-dictionary';
import type { Locale } from '@/dictionaries/types';
import NotificationsList from '../../components/notification/NotificationList';

interface PageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function NotificationsPage({ params }: PageProps) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <div className="space-y-6">
      

      { }
      <NotificationsList />
    </div>
  );
}