'use client'

import { useState } from 'react'
import type { QueryResponse } from '@/lib/types'

// TODO (v2): Server-side PDF with X-Vault sealing for formal records

interface Props {
  data: QueryResponse
}

export function ExportPdfButton({ data }: Props) {
  const [loading, setLoading] = useState(false)
  
  const exportPdf = async () => {
    setLoading(true)
    
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ])
      
      const reportHtml = generateReportElement(data)
      const container = document.createElement('div')
      container.innerHTML = reportHtml
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.top = '0'
      container.style.width = '794px'
      container.style.background = '#fafaf9'
      document.body.appendChild(container)
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#fafaf9'
      })
      
      document.body.removeChild(container)
      
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      
      const imgData = canvas.toDataURL('image/png')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * pdfWidth) / canvas.width
      
      let heightLeft = imgHeight
      let position = 0
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
      }
      
      const filename = `${data.drug}_adverse_events_${data.corpus.version || 'draft'}.pdf`
      pdf.save(filename)
      
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('PDF export failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <button
      onClick={exportPdf}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-eve-card border border-eve-border rounded-lg hover:border-eve-accent transition-colors disabled:opacity-50"
    >
      {loading ? 'Generating PDF...' : 'Download PDF'}
    </button>
  )
}

function generateReportElement(data: QueryResponse): string {
  const stats = data.stats
  const seriousPercent = stats 
    ? Math.round((stats.seriousness.serious / (stats.seriousness.serious + stats.seriousness.non_serious)) * 100)
    : 0
  const fatalCount = stats?.outcome_distribution['Fatal'] || 0
  
  const corpusVersion = data.corpus.version || 'Draft'
  const eveDecisionId = data.eve_decision_id || 'Not assigned'
  const generatedDate = new Date().toISOString().slice(0, 10)
  
  const topReactions = data.summary.top_reactions.slice(0, 10)
    .map(r => `<span style="background:#f5f5f4;border:1px solid #e7e5e4;padding:5px 12px;border-radius:6px;font-size:12px;display:inline-block;margin:3px;color:#44403c;">${r.reaction} <span style="color:#0d9488;font-weight:600;">${r.count}</span></span>`)
    .join(' ')
  
  const thStyle = 'text-align:left;padding:10px 14px;background:#f5f5f4;font-weight:600;color:#78716c;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e7e5e4;'
  const tdStyle = 'padding:10px 14px;border-bottom:1px solid #e7e5e4;color:#44403c;'
  
  const sexRows = stats ? Object.entries(stats.sex_distribution).filter(([, v]) => v > 0).map(([k, v]) => `<tr><td style="${tdStyle}">${k}</td><td style="${tdStyle}">${v}</td></tr>`).join('') : ''
  const ageRows = stats ? Object.entries(stats.age_distribution).filter(([, v]) => v > 0).map(([k, v]) => `<tr><td style="${tdStyle}">${k}</td><td style="${tdStyle}">${v}</td></tr>`).join('') : ''
  const outcomeRows = stats ? Object.entries(stats.outcome_distribution).filter(([, v]) => v > 0).map(([k, v]) => `<tr><td style="${tdStyle}">${k}</td><td style="${tdStyle}">${v}</td></tr>`).join('') : ''

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,SF Pro Text,Segoe UI,Roboto,sans-serif;padding:44px;color:#44403c;line-height:1.6;background:#fafaf9;">
  <div style="border-bottom:1px solid #e7e5e4;padding-bottom:20px;margin-bottom:28px;">
    <h1 style="font-size:28px;font-weight:600;text-transform:capitalize;color:#1c1917;margin:0 0 6px 0;">${data.drug}</h1>
    <div style="font-size:14px;color:#78716c;">Adverse Event Summary Â· FDA FAERS</div>
    <div style="font-size:12px;color:#78716c;margin-top:8px;">Snapshot: ${corpusVersion}</div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px;">
    <div style="background:#fff;border:1px solid #e7e5e4;border-radius:10px;padding:18px;text-align:center;">
      <div style="font-size:24px;font-weight:600;color:#1c1917;">${data.summary.total_events.toLocaleString()}</div>
      <div style="font-size:10px;color:#78716c;margin-top:6px;text-transform:uppercase;letter-spacing:0.05em;font-weight:500;">Events in Corpus</div>
    </div>
    <div style="background:#fff;border:1px solid #e7e5e4;border-radius:10px;padding:18px;text-align:center;">
      <div style="font-size:24px;font-weight:600;color:#1c1917;">${data.summary.total_in_fda.toLocaleString()}</div>
      <div style="font-size:10px;color:#78716c;margin-top:6px;text-transform:uppercase;letter-spacing:0.05em;font-weight:500;">Total in FDA</div>
    </div>
    <div style="background:#fff;border:1px solid #e7e5e4;border-radius:10px;padding:18px;text-align:center;">
      <div style="font-size:24px;font-weight:600;color:#1c1917;">${seriousPercent}%</div>
      <div style="font-size:10px;color:#78716c;margin-top:6px;text-transform:uppercase;letter-spacing:0.05em;font-weight:500;">Serious Reports</div>
    </div>
    <div style="background:#fff;border:1px solid #e7e5e4;border-radius:10px;padding:18px;text-align:center;">
      <div style="font-size:24px;font-weight:600;color:#1c1917;">${fatalCount.toLocaleString()}</div>
      <div style="font-size:10px;color:#78716c;margin-top:6px;text-transform:uppercase;letter-spacing:0.05em;font-weight:500;">Fatal Outcomes</div>
    </div>
  </div>
  <div style="margin-bottom:24px;">
    <h3 style="font-size:11px;font-weight:600;color:#78716c;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:0.05em;">Top Reported Reactions</h3>
    <div style="line-height:2.4;">${topReactions}</div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:20px;">
    <div>
      <h3 style="font-size:11px;font-weight:600;color:#78716c;margin:0 0 10px 0;text-transform:uppercase;letter-spacing:0.05em;">Sex Distribution</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e7e5e4;">
        <tr><th style="${thStyle}">Sex</th><th style="${thStyle}">Count</th></tr>
        ${sexRows}
      </table>
    </div>
    <div>
      <h3 style="font-size:11px;font-weight:600;color:#78716c;margin:0 0 10px 0;text-transform:uppercase;letter-spacing:0.05em;">Age Distribution</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e7e5e4;">
        <tr><th style="${thStyle}">Age Group</th><th style="${thStyle}">Count</th></tr>
        ${ageRows}
      </table>
    </div>
  </div>
  <div style="margin-bottom:24px;">
    <h3 style="font-size:11px;font-weight:600;color:#78716c;margin:0 0 10px 0;text-transform:uppercase;letter-spacing:0.05em;">Outcome Distribution</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e7e5e4;">
      <tr><th style="${thStyle}">Outcome</th><th style="${thStyle}">Count</th></tr>
      ${outcomeRows}
    </table>
  </div>
  <div style="background:rgba(100,116,139,0.08);border:1px solid #e7e5e4;border-radius:10px;padding:18px;margin-bottom:18px;">
    <h3 style="font-size:11px;font-weight:600;color:#64748b;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:0.05em;">Verification Data</h3>
    <div style="font-family:SF Mono,Monaco,Consolas,monospace;font-size:10px;color:#64748b;line-height:2;">
      <div><span style="color:#0d9488;font-weight:500;">EVE Decision ID:</span> ${eveDecisionId}</div>
      <div><span style="color:#0d9488;font-weight:500;">Corpus Version:</span> ${corpusVersion}</div>
      <div><span style="color:#0d9488;font-weight:500;">Root Hash:</span> ${data.corpus.root_hash || 'N/A'}</div>
      <div><span style="color:#0d9488;font-weight:500;">Stats Hash:</span> ${data.stats_hash || 'N/A'}</div>
    </div>
  </div>
  <div style="background:rgba(217,119,6,0.08);border:1px solid rgba(217,119,6,0.15);border-radius:10px;padding:16px 18px;font-size:12px;color:#44403c;line-height:1.6;margin-bottom:24px;">
    <strong style="color:#d97706;">Notice:</strong> This document is a visual export generated from EVE Medical Evidence. It reflects reported adverse event data from FDA FAERS and does not constitute medical advice or imply causality.
  </div>
  <div style="border-top:1px solid #e7e5e4;padding-top:18px;text-align:center;font-size:10px;color:#78716c;">
    <div style="color:#0d9488;margin-bottom:6px;font-weight:500;">Presented via EVE Â· Evidence & Verification Engine</div>
    <div>Snapshot: ${corpusVersion} Â· Generated: ${generatedDate}</div>
    <div style="margin-top:6px;">Patent Pending EVE-PAT-2026-001</div>
  </div>
</div>`
}


