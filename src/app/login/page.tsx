import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';
import { Building2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign In | ERP System',
  description: 'Sign in to your ERP account to access the project workflow management system.',
};

export default function LoginPage() {
  return (
    <div className="login-page">
      {/* Left Panel - Branding */}
      <div className="login-brand-panel">
        <div className="brand-content">
          <div className="brand-icon-wrapper">
            <Building2 size={48} strokeWidth={1.5} />
          </div>
          <h1 className="brand-title">ERP System</h1>
          <p className="brand-subtitle">
            Project Workflow Management
          </p>
          <div className="brand-features">
            <div className="brand-feature">
              <div className="feature-dot" />
              <span>Streamlined project management</span>
            </div>
            <div className="brand-feature">
              <div className="feature-dot" />
              <span>Real-time team collaboration</span>
            </div>
            <div className="brand-feature">
              <div className="feature-dot" />
              <span>Advanced analytics & reporting</span>
            </div>
          </div>
        </div>
        <div className="brand-gradient-orb brand-orb-1" />
        <div className="brand-gradient-orb brand-orb-2" />
      </div>

      {/* Right Panel - Login Form */}
      <div className="login-form-panel">
        <div className="login-form-container">
          <div className="login-form-header">
            {/* Mobile logo */}
            <div className="mobile-logo">
              <Building2 size={32} strokeWidth={1.5} />
              <span>ERP System</span>
            </div>
            <h2 className="login-title">Welcome back</h2>
            <p className="login-subtitle">
              Enter your credentials to access your account
            </p>
          </div>
          <LoginForm />
          <p className="login-footer">
            &copy; {new Date().getFullYear()} ERP System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
