'use client';

import React from 'react';
import { ProjectForm } from '@/components/projects/project-form';

export default function SupervisorNewProjectPage() {
  return (
    <div className="p-6 max-w-(--breakpoint-2xl) mx-auto">
      <ProjectForm role="supervisor" />
    </div>
  );
}
