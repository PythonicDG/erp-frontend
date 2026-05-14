import { ProjectDetailView } from '@/components/projects/project-detail-view';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SupervisorProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ProjectDetailView id={id} role="supervisor" />;
}
