import React from 'react';
import { ECNForm } from '@/components/ecn/ecn-form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeEditECNPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="py-2">
      <ECNForm id={id} role="employee" />
    </div>
  );
}
