import Link from 'next/link';
import PDFViewer from '../components/PDFViewer';

interface PageProps {
  params: Promise<{ lang: string; role: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

type ReferenceTab = 'loi-23-12' | 'loi-17-18' | 'faq';
type UserRole = 'commission' | 'validator';

export default async function ReferencesPage({ params, searchParams }: PageProps) {
   
  const { lang, role } = await params;
  const { tab } = await searchParams;

   
  const userRole: UserRole = ['commission', 'validator'].includes(role) ? (role as UserRole) : 'commission';

   
  const currentTab: ReferenceTab =
    ['loi-23-12', 'loi-17-18', 'faq'].includes(tab as string)
      ? (tab as ReferenceTab)
      : 'loi-23-12';

   
  const faqData = [
    { question: 'What is this first question ?', answer: 'This is the answer to the first question. It provides detailed information about the topic.' },
    { question: 'What is this second question ?', answer: 'This is the answer to the second question. It explains the process and requirements.' },
    { question: 'What is this third question ?', answer: 'This is the answer to the third question. It covers additional details and exceptions.' },
    { question: 'What is this fourth question ?', answer: 'This is the answer to the fourth question. It includes examples and best practices.' },
    { question: 'What is this last question ?', answer: 'This is the answer to the last question. It summarizes key points and next steps.' },
  ];

   
  const pdfPaths: Record<Exclude<ReferenceTab, 'faq'>, string> = {
    'loi-23-12': '/documents/loi-23-12.pdf',
    'loi-17-18': '/documents/loi-17-18.pdf',
  };

  return (
    <div className="space-y-6">
      { }
      <div className="val-tabs-container">
        <div className="flex items-center gap-6">
          {(['loi-23-12', 'loi-17-18', 'faq'] as ReferenceTab[]).map((tabName) => (
            <Link
              key={tabName}
              href={`/${lang}/validation/references/${userRole}?tab=${tabName}`}
              className={currentTab === tabName ? 'val-tab-active' : 'val-tab-inactive'}
            >
              <span className={currentTab === tabName ? 'val-tab-active-text' : 'val-tab-inactive-text'}>
                {tabName === 'loi-23-12'
                  ? 'Articles Loi 23-12'
                  : tabName === 'loi-17-18'
                  ? 'Articles Loi 17-18'
                  : 'FAQ'}
              </span>
            </Link>
          ))}
        </div>
      </div>

      { }
      <div className="val-references-content">
        {currentTab === 'faq' ? (
          <div className="val-faq-list">
            {faqData.map((item, index) => (
              <details key={index} className="val-faq-item">
                <summary className="val-faq-question">
                  {item.question}
                  <span className="val-faq-toggle">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="val-faq-answer">{item.answer}</div>
              </details>
            ))}
          </div>
        ) : (
          <PDFViewer pdfPath={pdfPaths[currentTab as Exclude<ReferenceTab, 'faq'>]} tabName={currentTab} />
        )}
      </div>
    </div>
  );
}