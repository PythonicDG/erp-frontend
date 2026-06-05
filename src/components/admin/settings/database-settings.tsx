'use client';

import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { Input } from '@/components/ui/input';
import { 
  Download, 
  Upload, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  FileJson,
  Loader2,
  Database
} from 'lucide-react';
import { settingsService } from '@/services/settings-service';
import toast from 'react-hot-toast';

export function DatabaseSettings() {
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');

  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);

  // Backup Database Handlers
  const handleBackup = async () => {
    setBackupLoading(true);
    const toastId = toast.loading('Generating backup...');
    try {
      const blob = await settingsService.backupDatabase();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `erp_backup_${dateStr}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      
      toast.success('Backup generated and downloaded successfully!', { id: toastId });
    } catch (error: any) {
      toast.error('Failed to generate backup.', { id: toastId });
    } finally {
      setBackupLoading(false);
    }
  };

  // Restore Database Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Only JSON backup files are allowed');
      return;
    }

    setSelectedFile(file);
  };

  const handleRestoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a backup JSON file first');
      return;
    }
    setIsRestoreConfirmOpen(true);
  };

  const confirmRestore = async () => {
    if (!selectedFile) return;
    setIsRestoreConfirmOpen(false);
    setRestoreLoading(true);
    const toastId = toast.loading('Restoring database records...');

    try {
      await settingsService.restoreDatabase(selectedFile);
      toast.success('Database restored successfully! Reloading page...', { id: toastId });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'Failed to restore database';
      toast.error(errMsg, { id: toastId });
    } finally {
      setRestoreLoading(false);
    }
  };

  // Reset Database Handlers
  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetConfirmationText !== 'RESET') {
      toast.error("Please type 'RESET' to confirm database deletion.");
      return;
    }
    setIsResetConfirmOpen(true);
  };

  const confirmReset = async () => {
    setIsResetConfirmOpen(false);
    setResetLoading(true);
    const toastId = toast.loading('Resetting all records...');

    try {
      const response = await settingsService.resetDatabase();
      toast.success(response.message || 'Database reset successfully!', { id: toastId });
      setResetConfirmationText('');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'Failed to reset database';
      toast.error(errMsg, { id: toastId });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Backup Card */}
        <div className="space-y-6">
          <Card 
            title="Database Backup" 
            subtitle="Download a full system backup to your local device. The backup will include projects, customers, audit logs, and workflow statuses."
          >
            <div className="py-4 space-y-6">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <FileJson className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Secure Backup Schema</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Data is packaged into a standard serialized JSON fixture. Authentication parameters and system permissions are automatically excluded to ensure security compliance.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleBackup}
                  disabled={backupLoading || restoreLoading || resetLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/10 h-11 px-6 w-full sm:w-auto"
                >
                  {backupLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Backup...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download Backup JSON
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {/* Restore Card */}
          <Card 
            title="Restore Database" 
            subtitle="Restore database tables from a previously downloaded JSON backup file. This operation will update matching records."
          >
            <form onSubmit={handleRestoreSubmit} className="py-4 space-y-6">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-amber-800">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">Danger Zone Warning</h4>
                  <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                    Restoring data will merge records and overwrite current data. Any new project or client updates created since this backup was taken might be lost or duplicated. We highly recommend downloading a backup of your current database before restoring.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Select Backup File (.json)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={backupLoading || restoreLoading || resetLoading}
                    className="h-10 border-slate-200"
                  >
                    <Upload className="h-4 w-4 mr-2 text-slate-400" />
                    Browse JSON File
                  </Button>
                  <span className="text-xs font-semibold text-slate-500 truncate max-w-[200px]">
                    {selectedFile ? selectedFile.name : 'No file selected'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Button
                  type="submit"
                  disabled={!selectedFile || backupLoading || restoreLoading || resetLoading}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-11 px-6 shadow-lg shadow-amber-500/10 w-full sm:w-auto"
                >
                  {restoreLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Restoring Data...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Restore From File
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Reset Database Card */}
        <div>
          <Card 
            title="System Reset" 
            subtitle="Completely clear all database records. This action cannot be undone."
          >
            <form onSubmit={handleResetSubmit} className="py-4 space-y-6">
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 text-red-800">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">Extreme Caution Required</h4>
                  <p className="text-[11px] text-red-700 mt-0.5 leading-relaxed">
                    This operation will purge the following tables:
                  </p>
                  <ul className="list-disc pl-5 mt-2 text-[10px] font-mono text-red-600 space-y-1">
                    <li>Projects & Dynamic Workflow Stage Timelines</li>
                    <li>Engineering Change Notes (ECN)</li>
                    <li>Application Software Change Notes (ASCN)</li>
                    <li>Customer Satisfaction Feedback Surveys</li>
                    <li>Customer Master Profiles</li>
                    <li>Standards Master & Inspection Authorities Master</li>
                    <li>All User Accounts (excluding SuperAdmins)</li>
                    <li>System Audit Logs & Notifications</li>
                  </ul>
                  <p className="text-[11px] text-red-700 mt-2.5 leading-relaxed">
                    <strong>Preserved:</strong> SuperAdmin Accounts, Company branding profiles, and workflow templates.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Verification Code
                </label>
                <p className="text-xs text-slate-400">To proceed, please type <strong className="text-slate-900 font-bold select-all">RESET</strong> in the input below:</p>
                <Input
                  placeholder="Type RESET"
                  value={resetConfirmationText}
                  onChange={(e) => setResetConfirmationText(e.target.value)}
                  disabled={backupLoading || restoreLoading || resetLoading}
                  className="h-10 text-sm max-w-xs font-mono font-bold tracking-widest text-slate-800"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Button
                  type="submit"
                  disabled={resetConfirmationText !== 'RESET' || backupLoading || restoreLoading || resetLoading}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold h-11 px-6 shadow-lg shadow-red-500/10 w-full sm:w-auto"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Resetting Database...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Reset All Records
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

      </div>

      {/* Confirmation Modal for Restore */}
      <ConfirmationModal
        isOpen={isRestoreConfirmOpen}
        onClose={() => setIsRestoreConfirmOpen(false)}
        onConfirm={confirmRestore}
        loading={restoreLoading}
        title="Confirm Database Restore?"
        message={`Are you sure you want to restore the system state from "${selectedFile?.name}"? All matching records will be overwritten. The application settings and page will automatically reload once the restore finishes.`}
        confirmLabel="Proceed with Restore"
        variant="warning"
      />

      {/* Confirmation Modal for Reset */}
      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={confirmReset}
        loading={resetLoading}
        title="CONFIRM SYSTEM RESET?"
        message="WARNING: This is a highly destructive action! You are about to clear all project files, customers, logs, and workflow records permanently. Do you wish to continue?"
        confirmLabel="Yes, Reset Database"
        variant="danger"
      />
    </div>
  );
}
