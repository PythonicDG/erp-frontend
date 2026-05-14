import { FormBuilder } from '@/components/admin/form-builder';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminFormFieldPage({ params }: PageProps) {
  const { id } = await params;
  return <FormBuilder stageId={id} />;
}
