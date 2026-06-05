'use client';

import React from 'react';
import { ASCNForm } from '@/components/ascn/ascn-form';

export default function SupervisorNewASCNPage() {
  return (
    <div className="py-2">
      <ASCNForm role="supervisor" />
    </div>
  );
}
