import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  title, 
  subtitle,
  footer,
  ...props
}) => {
  return (
    <div 
      {...props}
      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}
    >
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-slate-100">
          {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
          {footer}
        </div>
      )}
    </div>
  );
};
