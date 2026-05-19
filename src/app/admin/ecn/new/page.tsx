'use client';

import React from 'react';
import { ECNForm } from '@/components/ecn/ecn-form';

export default function AdminNewECNPage() {
  return (
    <div className="py-2">
      <ECNForm role="admin" />
    </div>
  );
}
