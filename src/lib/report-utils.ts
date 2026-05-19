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
    s.forEach((stage: any, index: number) => {
      if (stage.status === 'Locked') return;

      const formData = stage.current_submission?.data || {};
      const fields = stage.template_details.fields || [];

      // Avoid putting a page break before the very first page
      const pageBreakStyle = index > 0 ? 'page-break-before: always;' : '';

      let stageHtml = `
        <div class="stage-container" style="${pageBreakStyle} margin-bottom: 40px;">
          <h1 class="stage-title">${stage.template_details.name}</h1>
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
          <title>${c?.name || 'ERP'} - Stage Reports</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            
            body { 
              font-family: 'Inter', sans-serif; 
              color: #0f172a; 
              line-height: 1.6; 
              padding: 40px; 
              margin: 0; 
              background-color: #ffffff;
            }
            
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              border-bottom: 1.5px solid #e2e8f0; 
              padding-bottom: 16px; 
              margin-bottom: 35px; 
            }
            
            .company-name { 
              font-size: 16px; 
              font-weight: 700; 
              color: #0f172a; 
              text-transform: uppercase; 
              letter-spacing: 0.5px;
            }
            
            .logo { 
              height: 48px; 
              object-fit: contain; 
            }
            
            .stage-container { 
              margin-bottom: 40px;
            }
            
            .stage-title { 
              font-size: 20px; 
              font-weight: 700; 
              color: #0f172a; 
              margin-top: 0;
              margin-bottom: 24px; 
              text-transform: uppercase; 
              letter-spacing: 0.5px;
              border-bottom: 1px solid #f1f5f9;
              padding-bottom: 8px;
            }
            
            .field-grid { 
              display: grid; 
              grid-template-columns: repeat(2, 1fr); 
              gap: 20px; 
            }
            
            .field-item { 
              display: flex; 
              flex-direction: column; 
              gap: 4px; 
            }
            
            .field-label { 
              font-size: 11px; 
              font-weight: 600; 
              color: #64748b; 
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .field-value { 
              font-size: 13px; 
              color: #0f172a; 
              border-bottom: 1.5px solid #f1f5f9; 
              padding-bottom: 4px; 
              min-height: 20px;
            }
            
            .grid-field { 
              grid-column: span 2; 
              margin-top: 10px; 
            }
            
            .report-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px; 
              font-size: 12px; 
            }
            
            .report-table th { 
              background: #f8fafc; 
              text-align: left; 
              padding: 10px 12px; 
              font-weight: 600; 
              color: #475569; 
              border: 1px solid #e2e8f0; 
            }
            
            .report-table td { 
              padding: 10px 12px; 
              border: 1px solid #e2e8f0; 
              color: #1e293b; 
            }
            
            @media print {
              body { 
                padding: 0; 
              }
              @page { 
                margin: 1.5cm; 
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-container">
              ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : '<div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px;">ERP SYSTEM</div>'}
            </div>
            <div class="company-name">${c?.name || 'PCEPL Engineering'}</div>
          </div>

          ${allStagesHtml}

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
  }
};
