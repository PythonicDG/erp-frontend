import React from 'react';
import { ECNDetail } from '@/components/ecn/ecn-detail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SupervisorECNDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ECNDetail id={id} role="supervisor" />;
}
