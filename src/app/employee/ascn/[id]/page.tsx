import React from 'react';
import { ASCNDetail } from '@/components/ascn/ascn-detail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeASCNDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ASCNDetail id={id} role="employee" />;
}
