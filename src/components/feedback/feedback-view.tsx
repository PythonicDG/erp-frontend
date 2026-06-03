'use client';

import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Printer, 
  Eye, 
  Edit3, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ArrowLeft,
  Check,
  Send,
  Building2,
  FileText,
  User,
  Calendar,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import { feedbackService, CustomerFeedback, FeedbackStatus, PerformanceFeedbackRow } from '@/services/feedback-service';
import { projectService, Project } from '@/services/project-service';
import { settingsService, CompanyProfile } from '@/services/settings-service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface FeedbackViewProps {
  role: 'admin' | 'supervisor' | 'employee';
}

export function FeedbackView({ role }: FeedbackViewProps) {
  const { user } = useAuthStore();
  const isAdminOrSupervisor = role === 'admin' || role === 'supervisor' || user?.role === 'ADMIN' || user?.role === 'SUPERVISOR';
  
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  
  const [viewMode, setViewMode] = useState<'list' | 'fill' | 'view'>('list');
  const [selectedFeedback, setSelectedFeedback] = useState<CustomerFeedback | null>(null);
  const [activeTab, setActiveTab] = useState<FeedbackStatus>('Pending');

  // Form State
  const [formData, setFormData] = useState<Partial<CustomerFeedback>>({});

  useEffect(() => {
    fetchFeedbacks();
    fetchProfile();
    if (isAdminOrSupervisor) {
      fetchProjects();
    }
  }, [role]);

  const fetchProfile = async () => {
    try {
      const data = await settingsService.getCompanyProfile();
      setProfile(data);
    } catch (error) {
      // Silently fail
    }
  };

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const data = await feedbackService.getAll();
      setFeedbacks(data);
    } catch (error) {
      toast.error('Failed to load customer feedback forms');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const data = await projectService.getMinimalList();
      // Show all projects in selector
      setProjects(data as any);
    } catch (error) {
      console.error('Failed to load projects', error);
    }
  };

  const handleGenerateTest = async () => {
    if (!selectedProjectId) {
      toast.error('Please select a project first');
      return;
    }

    try {
      setGenerating(true);
      await feedbackService.generateNow(Number(selectedProjectId));
      toast.success('Customer Feedback Form generated successfully!');
      setSelectedProjectId('');
      setSearchQuery('');
      fetchFeedbacks();
    } catch (error) {
      toast.error('Failed to generate feedback form. Maybe it already exists.');
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenFill = (feedback: CustomerFeedback) => {
    setSelectedFeedback(feedback);
    setFormData({
      ...feedback,
      // Default signature dates to today if blank
      customer_rep_date: feedback.customer_rep_date || new Date().toISOString().split('T')[0],
      pcepl_rep_date: feedback.pcepl_rep_date || new Date().toISOString().split('T')[0],
    });
    setViewMode('fill');
  };

  const handleOpenView = (feedback: CustomerFeedback) => {
    setSelectedFeedback(feedback);
    setViewMode('view');
  };

  const handleRatingChange = (sr_no: number, rating: 'excellent' | 'good' | 'average' | 'poor') => {
    if (!formData.performance_feedback) return;
    
    const updatedFeedback = formData.performance_feedback.map(row => {
      if (row.sr_no === sr_no) {
        return {
          ...row,
          excellent: rating === 'excellent',
          good: rating === 'good',
          average: rating === 'average',
          poor: rating === 'poor'
        };
      }
      return row;
    });

    setFormData({
      ...formData,
      performance_feedback: updatedFeedback
    });
  };

  const handleRemarksChange = (sr_no: number, text: string) => {
    if (!formData.performance_feedback) return;
    
    const updatedFeedback = formData.performance_feedback.map(row => {
      if (row.sr_no === sr_no) {
        return { ...row, remarks: text };
      }
      return row;
    });

    setFormData({
      ...formData,
      performance_feedback: updatedFeedback
    });
  };

  const handleSave = async (isSubmit: boolean) => {
    if (!selectedFeedback) return;

    try {
      setLoading(true);
      const updateData: Partial<CustomerFeedback> = {
        customer_name: formData.customer_name,
        product_name: formData.product_name,
        customer_drawing_no: formData.customer_drawing_no,
        pcepl_part_no: formData.pcepl_part_no,
        usage_duration_months: formData.usage_duration_months,
        performance_feedback: formData.performance_feedback,
        customer_rep_name: formData.customer_rep_name,
        customer_rep_signature: formData.customer_rep_signature,
        customer_rep_date: formData.customer_rep_date,
        pcepl_rep_name: formData.pcepl_rep_name,
        pcepl_rep_signature: formData.pcepl_rep_signature,
        pcepl_rep_date: formData.pcepl_rep_date,
      };

      if (isSubmit) {
        updateData.status = 'Submitted';
      }

      await feedbackService.update(selectedFeedback.id, updateData);
      toast.success(isSubmit ? 'Feedback submitted successfully!' : 'Feedback details saved as draft');
      setViewMode('list');
      fetchFeedbacks();
    } catch (error) {
      toast.error('Failed to save feedback details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!formData) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    const companyName = profile?.name || 'PCEPL';
    const logoUrl = profile?.logo 
      ? (profile.logo.startsWith('http') ? profile.logo : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${profile.logo}`)
      : null;
    const imageLogo = logoUrl ? `<img src="${logoUrl}" style="height: 48px; object-fit: contain;" alt="Logo" />` : `<div style="font-size: 16px; font-weight: 800;">ERP SYSTEM</div>`;

    const performanceRows = (formData.performance_feedback || []).map(row => `
      <tr>
        <td style="text-align: center; font-family: monospace;">${row.sr_no}</td>
        <td style="font-weight: 500;">${row.parameter}</td>
        <td style="text-align: center; font-weight: bold; font-size: 14px;">${row.excellent ? '✓' : ''}</td>
        <td style="text-align: center; font-weight: bold; font-size: 14px;">${row.good ? '✓' : ''}</td>
        <td style="text-align: center; font-weight: bold; font-size: 14px;">${row.average ? '✓' : ''}</td>
        <td style="text-align: center; font-weight: bold; font-size: 14px;">${row.poor ? '✓' : ''}</td>
        <td>${row.remarks || ''}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Customer Feedback Form - ${formData.project_pid || ''}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;850&display=swap');
            
            body { 
              font-family: 'Inter', sans-serif; 
              color: #0f172a; 
              line-height: 1.5; 
              padding: 30px; 
              margin: 0; 
              background-color: #ffffff;
            }
            
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              border-bottom: 2px solid #000000;
              padding-bottom: 16px; 
              margin-bottom: 20px; 
            }
            
            .company-name { 
              font-size: 18px; 
              font-weight: 700; 
              color: #0f172a; 
              text-transform: uppercase; 
              letter-spacing: 0.5px;
            }
            
            .report-title { 
              font-size: 20px; 
              font-weight: 800; 
              color: #000000; 
              margin-top: 15px;
              margin-bottom: 25px; 
              text-transform: uppercase; 
              letter-spacing: 0.5px;
              text-align: center;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 10px;
            }

            .meta-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 12px;
            }
            .meta-table td {
              border: 1px solid #cbd5e1;
              padding: 8px 12px;
            }
            .meta-table td.label {
              font-weight: 700;
              background-color: #f8fafc;
              width: 25%;
            }

            .section-title {
              font-size: 13px;
              font-weight: 700;
              color: #000000;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              background-color: #f1f5f9;
              border: 1px solid #cbd5e1;
              padding: 8px 12px;
              margin-top: 25px;
              margin-bottom: 15px;
            }

            table.feedback-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 5px;
              font-size: 12px;
            }

            table.feedback-table th {
              background-color: #f8fafc;
              text-align: left;
              padding: 10px 12px;
              font-weight: 700;
              color: #1e293b;
              border: 1px solid #cbd5e1;
            }

            table.feedback-table td {
              padding: 8px 12px;
              border: 1px solid #cbd5e1;
              color: #334155;
            }

            .sign-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-top: 40px;
              page-break-inside: avoid;
            }
            .sign-box {
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 15px;
              background-color: #f8fafc;
              min-height: 120px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .sign-title {
              font-size: 10px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .signature {
              font-size: 16px;
              color: #2563eb;
              font-weight: bold;
              text-align: center;
              margin-top: 15px;
              border-bottom: 1px dashed #cbd5e1;
              padding-bottom: 5px;
              width: 80%;
              margin-left: auto;
              margin-right: auto;
            }
            .sign-name-date {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              color: #334155;
              margin-top: 10px;
            }

            @media print {
              body { padding: 0; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${companyName}</div>
            <div class="logo-container">${imageLogo}</div>
          </div>

          <h1 class="report-title">Post-Delivery Customer Feedback Form</h1>

          <table class="meta-table">
            <tr>
              <td class="label">Project ID(PID)</td>
              <td colspan="3">${formData.project_pid || ''}</td>
            </tr>
          </table>

          <div class="section-title">1. Project & Customer Details</div>
          <table class="meta-table">
            <tr>
              <td class="label">Customer Name</td>
              <td>${formData.customer_name || ''}</td>
              <td class="label">Product / Project Name</td>
              <td>${formData.product_name || ''}</td>
            </tr>
            <tr>
              <td class="label">Customer Part / Drawing Number</td>
              <td>${formData.customer_drawing_no || ''}</td>
              <td class="label">PCEPL Part Number</td>
              <td>${formData.pcepl_part_no || ''}</td>
            </tr>
            <tr>
              <td class="label">Panel / Product Dispatch Date</td>
              <td>${formData.panel_dispatch_date || ''}</td>
              <td class="label">Feedback Collection Date</td>
              <td>${formData.feedback_collection_date || ''}</td>
            </tr>
            <tr>
              <td class="label">Usage Duration (Months)</td>
              <td colspan="3">${formData.usage_duration_months || 12}</td>
            </tr>
          </table>

          <div class="section-title">2. Performance Feedback (Based on Usage)</div>
          <table class="feedback-table">
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">Sr. No</th>
                <th>Parameter</th>
                <th style="width: 80px; text-align: center;">Excellent</th>
                <th style="width: 80px; text-align: center;">Good</th>
                <th style="width: 80px; text-align: center;">Average</th>
                <th style="width: 80px; text-align: center;">Poor</th>
                <th style="width: 250px;">Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${performanceRows}
            </tbody>
          </table>

          <div class="sign-grid">
            <div class="sign-box">
              <div class="sign-title">3. Feedback Provided By (Customer Rep.)</div>
              <div class="signature">${formData.customer_rep_signature || ''}</div>
              <div class="sign-name-date">
                <span><strong>Name:</strong> ${formData.customer_rep_name || ''}</span>
                <span><strong>Date:</strong> ${formData.customer_rep_date || ''}</span>
              </div>
            </div>
            <div class="sign-box">
              <div class="sign-title">4. Reviewed By (PCEPL Rep.)</div>
              <div class="signature">${formData.pcepl_rep_signature || ''}</div>
              <div class="sign-name-date">
                <span><strong>Name:</strong> ${formData.pcepl_rep_name || ''}</span>
                <span><strong>Date:</strong> ${formData.pcepl_rep_date || ''}</span>
              </div>
            </div>
          </div>

          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case 'Submitted':
        return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" /> Submitted</Badge>;
      case 'Pending':
        return <Badge variant="warning"><AlertCircle className="h-3 w-3 mr-1" /> Due / Pending</Badge>;
      case 'Scheduled':
        return <Badge variant="info"><Clock className="h-3 w-3 mr-1" /> Scheduled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => f.status === activeTab);

  if (viewMode === 'list') {
    return (
      <div className="p-6 max-w-(--breakpoint-2xl) mx-auto space-y-8 no-print">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Customer Feedback Forms</h1>
            <p className="text-slate-500 mt-1">
              Monitor, generate, and complete post-delivery customer satisfaction feedback forms.
            </p>
          </div>
        </div>

        {/* Admin Testing Panel */}
        {isAdminOrSupervisor && (
          <Card className="p-6 bg-slate-50/50 border border-slate-200/80 rounded-2xl relative overflow-visible">
            {dropdownOpen && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setDropdownOpen(false)}
              />
            )}
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-3">Testing & Manual Generation Tool</h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 relative z-50">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Search project by PID, Name, or Customer Name..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedProjectId('');
                    setDropdownOpen(true);
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
                />
                
                {/* Autocomplete Dropdown list */}
                {dropdownOpen && searchQuery.trim() !== '' && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {projects
                      .filter(p => {
                        const q = searchQuery.toLowerCase();
                        return (
                          p.pid?.toLowerCase().includes(q) ||
                          p.name?.toLowerCase().includes(q) ||
                          p.customer_name?.toLowerCase().includes(q)
                        );
                      })
                      .map(project => (
                        <div
                          key={project.id}
                          className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-sm transition-colors border-b border-slate-100 last:border-0"
                          onClick={() => {
                            setSelectedProjectId(project.id.toString());
                            setSearchQuery(`${project.pid} - ${project.name} (${project.customer_name})`);
                            setDropdownOpen(false);
                          }}
                        >
                          <div className="font-semibold text-slate-800">{project.pid} - {project.name}</div>
                          <div className="text-xs text-slate-500">{project.customer_name}</div>
                        </div>
                      ))}
                    {projects.filter(p => {
                      const q = searchQuery.toLowerCase();
                      return (
                        p.pid?.toLowerCase().includes(q) ||
                        p.name?.toLowerCase().includes(q) ||
                        p.customer_name?.toLowerCase().includes(q)
                      );
                    }).length === 0 && (
                      <div className="px-4 py-3 text-sm text-slate-500 text-center">No projects match your search</div>
                    )}
                  </div>
                )}
              </div>
              <Button 
                onClick={handleGenerateTest}
                disabled={generating || !selectedProjectId}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate Feedback Form Now
              </Button>
            </div>
          </Card>
        )}

        {/* Tab buttons */}
        <div className="border-b border-slate-200">
          <div className="flex space-x-6">
            {(['Pending', 'Scheduled', 'Submitted'] as FeedbackStatus[]).map((tab) => {
              const count = feedbacks.filter(f => f.status === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 px-1 text-sm font-semibold border-b-2 transition-all relative ${
                    activeTab === tab 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab === 'Pending' ? 'Due / Ready' : tab}
                  <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${
                    activeTab === tab 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid List */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">Loading feedback forms...</div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <ClipboardList className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-slate-800">No forms in {activeTab} status</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mt-1">
              {activeTab === 'Pending' 
                ? 'Feedback forms will automatically appear here exactly one year after their project completes.'
                : activeTab === 'Scheduled' 
                  ? 'Scheduled forms will automatically transition to "Due" when their target date is reached.'
                  : 'Submitted forms represent finalized customer evaluations.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFeedbacks.map((feedback) => (
              <Card key={feedback.id} className="p-6 border border-slate-200 hover:border-blue-500/30 transition-all hover:shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                      {feedback.project_pid}
                    </span>
                    {getStatusBadge(feedback.status)}
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight line-clamp-1">{feedback.product_name}</h3>
                  <p className="text-slate-500 text-sm mt-1 flex items-center font-medium">
                    <Building2 className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                    {feedback.customer_name}
                  </p>

                  <div className="border-t border-slate-100 my-4 pt-3 space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Scheduled Date:</span>
                      <span className="font-semibold">{new Date(feedback.scheduled_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    {feedback.panel_dispatch_date && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Dispatch Date:</span>
                        <span className="font-semibold">{new Date(feedback.panel_dispatch_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100 mt-4">
                  {feedback.status === 'Pending' ? (
                    <Button 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 shadow-sm font-semibold"
                      onClick={() => handleOpenFill(feedback)}
                    >
                      <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                      Fill Feedback
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost"
                      className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs py-2 font-semibold"
                      onClick={() => handleOpenView(feedback)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View Details
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Edit / Form Filling and View Details Mode
  return (
    <div className="p-6 max-w-(--breakpoint-lg) mx-auto space-y-8 print:p-0 print:shadow-none print:border-none print:max-w-full">
      {/* CSS PRINT RULES */}
      <style jsx global>{`
        @media print {
          body, html {
            background-color: white !important;
            color: #000000 !important;
            font-size: 11px !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Hide sidebar, navbar, buttons, and system controls */
          .sidebar, 
          .navbar, 
          .no-print, 
          button, 
          .badge-container, 
          .print-hide, 
          header, 
          nav, 
          aside {
            display: none !important;
          }
          /* Reset Next.js layout structures */
          .dashboard-layout,
          .dashboard-main,
          .dashboard-content,
          main {
            margin: 0 !important;
            padding: 0 !important;
            margin-left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: transparent !important;
          }
          .print-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            background: transparent !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 10px !important;
          }
          th, td {
            border: 1px solid #000000 !important;
            padding: 8px 10px !important;
            text-align: left !important;
            color: #000000 !important;
          }
          th {
            background-color: #f1f5f9 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Form input borders */
          input[type="text"], input[type="number"], input[type="date"], select, textarea {
            border: none !important;
            border-bottom: 1px dashed #000000 !important;
            background: transparent !important;
            padding: 0 !important;
            height: auto !important;
            color: #000000 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          input[type="radio"] {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            border: 1px solid #000000 !important;
          }
          @page {
            size: A4 portrait;
            margin: 1.5cm;
          }
        }
      `}</style>

      {/* Back button */}
      <button 
        onClick={() => setViewMode('list')}
        className="flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900 transition-all gap-1.5 no-print"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      {/* Printable Area Wrapper */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 md:p-12 print-card">
        
        {/* Document Header */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-200 pb-6 mb-6">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">Post-Delivery Customer Feedback Form</h2>
              <p className="text-slate-400 text-xs font-semibold">CUSTOMER SATISFACTION SURVEY RECORD</p>
            </div>
          </div>
        </div>

        {/* Section 1: Project & Customer Details */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-800 bg-slate-100 px-4 py-2 rounded-lg mb-4 uppercase tracking-wider">
            1. Project & Customer Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer Name</label>
                <Input 
                  value={formData.customer_name || ''}
                  readOnly={true}
                  className="h-10 text-sm mt-1 bg-slate-50 border-slate-200 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product / Project Name</label>
                <Input 
                  value={formData.product_name || ''}
                  readOnly={true}
                  className="h-10 text-sm mt-1 bg-slate-50 border-slate-200 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer Part / Drawing Number</label>
                <Input 
                  value={formData.customer_drawing_no || ''}
                  readOnly={true}
                  className="h-10 text-sm mt-1 bg-slate-50 border-slate-200 cursor-not-allowed"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PCEPL Part Number</label>
                <Input 
                  value={formData.pcepl_part_no || ''}
                  readOnly={true}
                  className="h-10 text-sm mt-1 bg-slate-50 border-slate-200 cursor-not-allowed"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dispatch Date</label>
                  <Input 
                    type="date"
                    value={formData.panel_dispatch_date || ''}
                    readOnly={true}
                    className="h-10 text-sm mt-1 bg-slate-50 border-slate-200 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collection Date</label>
                  <Input 
                    type="date"
                    value={formData.feedback_collection_date || ''}
                    disabled={viewMode === 'view'}
                    onChange={(e) => setFormData({...formData, feedback_collection_date: e.target.value})}
                    className="h-10 text-sm mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Usage Duration (Months)</label>
                <Input 
                  type="number"
                  value={formData.usage_duration_months || 12}
                  disabled={viewMode === 'view'}
                  onChange={(e) => setFormData({...formData, usage_duration_months: Number(e.target.value)})}
                  className="h-10 text-sm mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Performance Feedback */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-800 bg-slate-100 px-4 py-2 rounded-lg mb-4 uppercase tracking-wider">
            2. Performance Feedback (Based on Usage)
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 font-semibold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-3 w-16 text-center border-r border-slate-200">Sr. No.</th>
                  <th className="p-3 border-r border-slate-200">Parameter</th>
                  <th className="p-3 w-24 text-center border-r border-slate-200">Excellent</th>
                  <th className="p-3 w-24 text-center border-r border-slate-200">Good</th>
                  <th className="p-3 w-24 text-center border-r border-slate-200">Average</th>
                  <th className="p-3 w-24 text-center border-r border-slate-200">Poor</th>
                  <th className="p-3 min-w-[200px]">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(formData.performance_feedback || []).map((row) => (
                  <tr key={row.sr_no} className="hover:bg-slate-50/50">
                    <td className="p-3 text-center border-r border-slate-200 font-mono text-slate-500">{row.sr_no}</td>
                    <td className="p-3 border-r border-slate-200 font-medium text-slate-800">{row.parameter}</td>
                    
                    {/* Excellent */}
                    <td className="p-3 text-center border-r border-slate-200">
                      <input 
                        type="radio"
                        name={`rating-${row.sr_no}`}
                        checked={!!row.excellent}
                        disabled={viewMode === 'view'}
                        onChange={() => handleRatingChange(row.sr_no, 'excellent')}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                    </td>
                    
                    {/* Good */}
                    <td className="p-3 text-center border-r border-slate-200">
                      <input 
                        type="radio"
                        name={`rating-${row.sr_no}`}
                        checked={!!row.good}
                        disabled={viewMode === 'view'}
                        onChange={() => handleRatingChange(row.sr_no, 'good')}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                    </td>
                    
                    {/* Average */}
                    <td className="p-3 text-center border-r border-slate-200">
                      <input 
                        type="radio"
                        name={`rating-${row.sr_no}`}
                        checked={!!row.average}
                        disabled={viewMode === 'view'}
                        onChange={() => handleRatingChange(row.sr_no, 'average')}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                    </td>
                    
                    {/* Poor */}
                    <td className="p-3 text-center border-r border-slate-200">
                      <input 
                        type="radio"
                        name={`rating-${row.sr_no}`}
                        checked={!!row.poor}
                        disabled={viewMode === 'view'}
                        onChange={() => handleRatingChange(row.sr_no, 'poor')}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                    </td>
                    
                    {/* Remarks */}
                    <td className="p-2">
                      <input 
                        type="text"
                        value={row.remarks || ''}
                        disabled={viewMode === 'view'}
                        onChange={(e) => handleRemarksChange(row.sr_no, e.target.value)}
                        placeholder="Add remarks..."
                        className="w-full px-2 py-1.5 text-xs rounded-md border border-slate-200 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all bg-transparent"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3 & 4 Sign-offs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-200 pt-6">
          
          {/* Section 3: Feedback Provided By */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/20">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2.5 mb-4">
              3. Feedback Provided By (Customer Rep.)
            </h4>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</label>
                <Input 
                  value={formData.customer_rep_name || ''}
                  disabled={viewMode === 'view'}
                  onChange={(e) => setFormData({...formData, customer_rep_name: e.target.value})}
                  className="h-9 text-xs mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Signature (Type to sign)</label>
                <Input 
                  value={formData.customer_rep_signature || ''}
                  disabled={viewMode === 'view'}
                  placeholder="e.g. John Doe"
                  onChange={(e) => setFormData({...formData, customer_rep_signature: e.target.value})}
                  className="h-9 text-xs mt-1 font-signature text-base text-blue-600 bg-slate-50"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</label>
                <Input 
                  type="date"
                  value={formData.customer_rep_date || ''}
                  disabled={viewMode === 'view'}
                  onChange={(e) => setFormData({...formData, customer_rep_date: e.target.value})}
                  className="h-9 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Reviewed By */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/20">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2.5 mb-4">
              4. Reviewed By (PCEPL Rep.)
            </h4>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</label>
                <Input 
                  value={formData.pcepl_rep_name || ''}
                  disabled={viewMode === 'view'}
                  onChange={(e) => setFormData({...formData, pcepl_rep_name: e.target.value})}
                  className="h-9 text-xs mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Signature (Type to sign)</label>
                <Input 
                  value={formData.pcepl_rep_signature || ''}
                  disabled={viewMode === 'view'}
                  placeholder="e.g. Reviewer Name"
                  onChange={(e) => setFormData({...formData, pcepl_rep_signature: e.target.value})}
                  className="h-9 text-xs mt-1 font-signature text-base text-blue-600 bg-slate-50"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</label>
                <Input 
                  type="date"
                  value={formData.pcepl_rep_date || ''}
                  disabled={viewMode === 'view'}
                  onChange={(e) => setFormData({...formData, pcepl_rep_date: e.target.value})}
                  className="h-9 text-xs mt-1"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-8 border-t border-slate-200 pt-6 no-print">
          <Button 
            variant="ghost"
            onClick={handlePrint}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Form
          </Button>
          
          {viewMode === 'fill' && (
            <>
              <Button 
                variant="ghost"
                onClick={() => handleSave(false)}
                className="border border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                Save Draft
              </Button>
              <Button 
                onClick={() => handleSave(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md shadow-emerald-500/10"
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Feedback
              </Button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
