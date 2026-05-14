'use client';

import React from 'react';
import { Card } from './card';
import { Button } from './button';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'warning',
  loading = false
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const variants = {
    danger: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200',
    warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200',
    info: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
  };

  const icons = {
    danger: <AlertTriangle className="h-6 w-6 text-rose-600" />,
    warning: <AlertTriangle className="h-6 w-6 text-amber-500" />,
    info: <AlertTriangle className="h-6 w-6 text-blue-600" />
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-md p-0 overflow-hidden shadow-2xl border-none">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${variant === 'danger' ? 'bg-rose-50' : variant === 'warning' ? 'bg-amber-50' : 'bg-blue-50'}`}>
              {icons[variant]}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="p-4 bg-slate-50 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            loading={loading}
            className={`${variants[variant]} text-white font-bold px-6 shadow-lg`}
          >
            {confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
