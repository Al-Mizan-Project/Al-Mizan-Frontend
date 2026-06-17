'use client';

import Link from 'next/link';
import PDFViewer from '../components/PDFViewer';

interface PageProps {
  params: Promise<{ lang: string; role: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

type ReferenceTab = 'loi-23-12' | 'loi-17-18';
type UserRole = 'commission' | 'validator';

export default async function ReferencesPage({ params, searchParams }: PageProps) {
   
  const { lang, role } = await params;
  const { tab } = await searchParams;

   
  const userRole: UserRole = ['commission', 'validator'].includes(role) ? (role as UserRole) : 'commission';

   
  const currentTab: ReferenceTab =
    ['loi-23-12', 'loi-17-18'].includes(tab as string)
      ? (tab as ReferenceTab)
      : 'loi-23-12';

   
  const pdfPaths: Record<ReferenceTab, string> = {
    'loi-23-12': '/documents/loi-23-12.pdf',
    'loi-17-18': '/documents/loi-17-18.pdf',
  };

  return (
    <div className="space-y-6">
      { }
      <div className="val-tabs-container">
        <div className="flex items-center gap-6">
          {(['loi-23-12', 'loi-17-18'] as ReferenceTab[]).map((tabName) => (
            <Link
              key={tabName}
              href={`/${lang}/validation/references/${userRole}?tab=${tabName}`}
              className={currentTab === tabName ? 'val-tab-active' : 'val-tab-inactive'}
            >
              <span className={currentTab === tabName ? 'val-tab-active-text' : 'val-tab-inactive-text'}>
                {tabName === 'loi-23-12'
                  ? 'Articles Loi 23-12'
                  : 'Articles Loi 17-18'}
              </span>
            </Link>
          ))}
        </div>
      </div>

      { }
      <div className="val-references-content">
        <PDFViewer pdfPath={pdfPaths[currentTab]} tabName={currentTab} />
      </div>
    </div>
  );
}