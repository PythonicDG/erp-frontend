import React from 'react';
import { ASCNForm } from '@/components/ascn/ascn-form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditASCNPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="py-2">
      <ASCNForm id={id} role="admin" />
    </div>
  );
}
