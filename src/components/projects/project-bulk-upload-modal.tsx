'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  X, 
  FileSpreadsheet, 
  ChevronDown, 
  ChevronUp, 
  Info 
} from 'lucide-react';
import { projectService } from '@/services/project-service';
import toast from 'react-hot-toast';

interface BulkUploadResult {
  success_count: number;
  skipped_count: number;
  failure_count: number;
  total_processed: number;
  errors: Array<{ row: number; project_name: string; error_message: string }>;
  skipped: Array<{ row: number; project_name: string; reason: string }>;
  successes: string[];
}

interface ProjectBulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProjectBulkUploadModal({ isOpen, onClose, onSuccess }: ProjectBulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const [showSkippedDetails, setShowSkippedDetails] = useState(false);
  const [showFailedDetails, setShowFailedDetails] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.xlsx')) {
        setFile(droppedFile);
      } else {
        toast.error('Only .xlsx files are supported');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const downloadTemplate = async () => {
    try {
      toast.loading('Generating template...', { id: 'download' });
      const blob = await projectService.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'projects_bulk_upload_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Template downloaded successfully!', { id: 'download' });
    } catch (error) {
      toast.error('Failed to download template', { id: 'download' });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select an Excel file first');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Uploading and processing projects...');
    try {
      const data = await projectService.bulkUpload(file, skipDuplicates);
      setResult(data);
      
      if (data.success_count > 0) {
        toast.success(`Successfully imported ${data.success_count} projects!`, { id: toastId });
        onSuccess();
      } else if (data.failure_count > 0) {
        toast.error('All rows failed to import. See details below.', { id: toastId });
      } else {
        toast.success('File processed. No new projects created.', { id: toastId });
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.error || 'Failed to complete bulk upload';
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setResult(null);
    setLoading(false);
    setShowSkippedDetails(false);
    setShowFailedDetails(true);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-2xl p-0 overflow-hidden shadow-2xl border border-slate-200 bg-white rounded-2xl max-h-[90vh] flex flex-col my-8">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600 animate-pulse" />
              Bulk Upload Projects
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Upload Excel sheet to quickly populate your project database.
            </p>
          </div>
          <button 
            onClick={handleClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-lg hover:bg-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content (Scrollable if results are large) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 select-none">
          {!result ? (
            <>
              {/* Instructions and Download Template */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-900">Upload Instructions</h4>
                  <ul className="text-xs text-blue-700 mt-1.5 list-disc pl-4 space-y-1">
                    <li>Please download the official sample template below.</li>
                    <li>Required fields: <strong>Project Name</strong>, <strong>Customer Name</strong>, <strong>Date Received</strong>.</li>
                    <li>Date columns must use a standard format (e.g. <code>YYYY-MM-DD</code> or <code>DD/MM/YYYY</code>).</li>
                    <li>If a Client doesn't exist in the database, it will be automatically created.</li>
                    <li>Assignee field will look up user by email address or full name.</li>
                  </ul>
                  <button 
                    onClick={downloadTemplate}
                    className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors px-3 py-1.5 rounded-lg mt-3"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Sample Excel Template
                  </button>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                    : file
                    ? 'border-emerald-500 bg-emerald-50/10'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept=".xlsx"
                  className="hidden" 
                />
                
                {file ? (
                  <>
                    <FileSpreadsheet className="h-12 w-12 text-emerald-600" />
                    <p className="text-sm font-bold text-slate-800 mt-3">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-700 hover:underline mt-4"
                    >
                      Remove File
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-slate-400 group-hover:text-blue-500" />
                    <p className="text-sm font-medium text-slate-700 mt-3">
                      Drag & Drop Excel (.xlsx) file here, or <span className="text-blue-600 font-bold hover:underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Only .xlsx format is supported</p>
                  </>
                )}
              </div>

              {/* Configuration Option */}
              <div className="flex items-center gap-2 px-1">
                <input
                  id="skip-duplicates"
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="skip-duplicates" className="text-sm text-slate-700 font-medium cursor-pointer">
                  Skip duplicate records (based on same Project Name and Customer Name)
                </label>
              </div>
            </>
          ) : (
            /* Results Summary Section */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-bold text-slate-800">Processing Summary</h4>
                <button 
                  onClick={resetModal}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Upload Another File
                </button>
              </div>

              {/* Stat Cards Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
                  <div className="flex justify-center mb-1 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-black text-slate-800">{result.success_count}</p>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mt-1">Imported</p>
                </div>
                
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-center">
                  <div className="flex justify-center mb-1 text-amber-500">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-black text-slate-800">{result.skipped_count}</p>
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mt-1">Skipped</p>
                </div>

                <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-center">
                  <div className="flex justify-center mb-1 text-rose-500">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-black text-slate-800">{result.failure_count}</p>
                  <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mt-1">Failed</p>
                </div>
              </div>

              {/* Skipped Details Accordion */}
              {result.skipped_count > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowSkippedDetails(!showSkippedDetails)}
                    className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Skipped Records ({result.skipped_count})
                    </span>
                    {showSkippedDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {showSkippedDetails && (
                    <div className="max-h-40 overflow-y-auto border-t border-slate-200 text-xs divide-y divide-slate-100 bg-white">
                      {result.skipped.map((skip, i) => (
                        <div key={i} className="px-4 py-2.5 flex items-start justify-between gap-4">
                          <div>
                            <span className="font-semibold text-slate-900">{skip.project_name}</span>
                            <span className="text-slate-400 mx-2">•</span>
                            <span className="text-slate-500">{skip.reason}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded flex-shrink-0">
                            Row {skip.row}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Failed Details Accordion */}
              {result.failure_count > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowFailedDetails(!showFailedDetails)}
                    className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-rose-500" />
                      Failed Rows / Validation Errors ({result.failure_count})
                    </span>
                    {showFailedDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {showFailedDetails && (
                    <div className="max-h-56 overflow-y-auto border-t border-slate-200 text-xs divide-y divide-slate-100 bg-white">
                      {result.errors.map((err, i) => (
                        <div key={i} className="px-4 py-3 flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {err.project_name !== 'N/A' ? `Project: ${err.project_name}` : 'Unknown Project'}
                            </p>
                            <p className="text-rose-600 font-medium mt-0.5">{err.error_message}</p>
                          </div>
                          <span className="text-[10px] font-mono text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded flex-shrink-0">
                            Row {err.row}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={loading}
          >
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button
              onClick={handleUpload}
              disabled={loading || !file}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-md shadow-blue-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Process Excel File'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
