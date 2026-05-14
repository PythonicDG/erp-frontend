import { projectService } from '@/services/project-service';
import toast from 'react-hot-toast';

export const generateFullProjectReport = async (projectId: string | number) => {
  try {
    const fullData = await projectService.getFullReport(projectId);
    const { project: p, stages: s, company: c } = fullData;

    const logoUrl = c?.logo 
      ? (c.logo.startsWith('http') ? c.logo : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${c.logo}`)
      : null;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to view report');
      return;
    }

    let allStagesHtml = '';
    s.forEach((stage: any) => {
      if (stage.status === 'Locked') return;

      const formData = stage.current_submission?.data || {};
      const fields = stage.template_details.fields || [];

      let stageHtml = `
        <div class="stage-container" style="page-break-before: always;">
          <h2 class="stage-title">STAGE: ${stage.template_details.name}</h2>
          <div class="stage-meta">
            <span>Status: ${stage.status}</span>
            <span>Completed: ${stage.completed_at ? new Date(stage.completed_at).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div class="field-grid">
      `;

      fields.forEach((f: any) => {
        const val = formData[f.name];
        if (f.field_type === 'grid') {
          const rows = val || [];
          const columns = f.configuration?.columns || ['Value', 'Remarks'];
          const hasParameter = (f.configuration?.rows?.length || 0) > 0;
          
          stageHtml += `
            <div class="grid-field">
              <label class="field-label">${f.label}</label>
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Sr.</th>
                    ${hasParameter ? '<th>Parameter</th>' : ''}
                    ${columns.map((col: string) => `<th>${col}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${rows.map((r: any, i: number) => `
                    <tr>
                      <td>${i + 1}</td>
                      ${hasParameter ? `<td>${r.parameter || ''}</td>` : ''}
                      ${columns.map((col: string) => `<td>${r[col] || ''}</td>`).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `;
        } else {
          stageHtml += `
            <div class="field-item">
              <label class="field-label">${f.label}</label>
              <div class="field-value">${val === true ? 'Yes' : val === false ? 'No' : (val || '—')}</div>
            </div>
          `;
        }
      });

      stageHtml += `</div></div>`;
      allStagesHtml += stageHtml;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Project Full Report - ${p.pid}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.5; padding: 40px; margin: 0; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info { text-align: right; }
            .company-name { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; }
            .company-details { font-size: 11px; color: #64748b; margin-top: 4px; }
            .logo { height: 60px; object-fit: contain; }
            
            .report-title { font-size: 28px; font-weight: 700; color: #0f172a; margin-bottom: 30px; text-align: center; text-transform: uppercase; letter-spacing: 2px; border-bottom: 4px solid #f1f5f9; padding-bottom: 10px; }
            
            .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; background: #f8fafc; padding: 24px; border-radius: 12px; margin-bottom: 40px; border: 1px solid #e2e8f0; }
            .info-item { display: flex; flex-direction: column; gap: 4px; }
            .info-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
            .info-value { font-size: 14px; font-weight: 600; color: #1e293b; }
            
            .stage-container { margin-bottom: 50px; border: 1px solid #f1f5f9; padding: 24px; border-radius: 12px; }
            .stage-title { font-size: 18px; font-weight: 700; color: #3b82f6; margin-bottom: 10px; border-left: 4px solid #3b82f6; padding-left: 12px; }
            .stage-meta { font-size: 12px; color: #64748b; margin-bottom: 20px; display: flex; gap: 20px; background: #f1f5f9; padding: 8px 12px; border-radius: 6px; }
            
            .field-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
            .field-item { display: flex; flex-direction: column; gap: 4px; }
            .field-label { font-size: 11px; font-weight: 600; color: #64748b; }
            .field-value { font-size: 13px; color: #0f172a; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
            
            .grid-field { grid-column: span 2; margin-top: 10px; }
            .report-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            .report-table th { background: #f8fafc; text-align: left; padding: 12px; font-weight: 700; color: #475569; border: 1px solid #e2e8f0; }
            .report-table td { padding: 12px; border: 1px solid #e2e8f0; color: #1e293b; }
            
            .footer { position: fixed; bottom: 30px; left: 40px; right: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
            
            @media print {
              body { padding: 20px; }
              .stage-container { border: none; padding: 0; }
              @page { margin: 2cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-container">
              ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : '<div style="font-size: 24px; font-weight: 800; color: #3b82f6;">ERP SYSTEM</div>'}
            </div>
            <div class="company-info">
              <p class="company-name">${c?.name || 'PCEPL Engineering'}</p>
              <p class="company-details">
                ${c?.address || ''}<br/>
                ${c?.city || ''}, ${c?.state || ''} ${c?.postal_code || ''}<br/>
                Email: ${c?.email || ''} | Phone: ${c?.phone || ''}
              </p>
            </div>
          </div>

          <h1 class="report-title">PROJECT SUMMARY REPORT</h1>

          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">PROJECT NAME</span>
              <span class="info-value">${p.name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">PROJECT ID</span>
              <span class="info-value">${p.pid}</span>
            </div>
            <div class="info-item">
              <span class="info-label">CUSTOMER</span>
              <span class="info-value">${p.customer_name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">PROJECT TYPE</span>
              <span class="info-value">${p.project_type}</span>
            </div>
            <div class="info-item">
              <span class="info-label">STATUS</span>
              <span class="info-value">${p.status}</span>
            </div>
            <div class="info-item">
              <span class="info-label">DATE RECEIVED</span>
              <span class="info-value">${new Date(p.date_received).toLocaleDateString()}</span>
            </div>
          </div>

          ${allStagesHtml}

          <div class="footer">
            <span>Report Generated on ${new Date().toLocaleString()}</span>
            <span>ERP System - Confidential Project Dossier</span>
            <span>Page 1</span>
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
  } catch (error) {
    toast.error('Failed to generate report');
    // toast.error('PDF Generation Failed');
  }
};
