'use client';

import React from 'react';
import { ASCNForm } from '@/components/ascn/ascn-form';

export default function EmployeeNewASCNPage() {
  return (
    <div className="py-2">
      <ASCNForm role="employee" />
    </div>
  );
}
