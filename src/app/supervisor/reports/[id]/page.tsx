import { ReportsListView } from '@/components/reports/reports-list-view';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SupervisorReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ReportsListView role="supervisor" initialProjectId={id} />;
}
