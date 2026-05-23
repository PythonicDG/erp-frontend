import { ReportProjectDetailView } from '@/components/reports/report-project-detail-view';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SupervisorReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ReportProjectDetailView id={id} role="supervisor" />;
}
