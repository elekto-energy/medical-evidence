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
      // Dynamically import libraries (client-side only)
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ])
      
      // Create a temporary container with the report content
      const reportHtml = generateReportElement(data)
      const container = document.createElement('div')
      container.innerHTML = reportHtml
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.top = '0'
      container.style.width = '794px'
      container.style.background = '#ffffff'
      document.body.appendChild(container)
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })
      
      document.body.removeChild(container)
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
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
      
      const filename = `${data.drug}_adverse_events_${data.corpus_version || 'draft'}.pdf`
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
  
  const corpusVersion = data.corpus_version || 'Draft'
  const eveDecisionId = data.eve_decision_id || 'Not assigned'
  const generatedDate = new Date().toISOString().slice(0, 10)
  
  const topReactions = data.summary.top_reactions.slice(0, 10)
    .map(r => `<span style="background:#f5f6f8;border:1px solid #dce0e6;padding:4px 10px;border-radius:4px;font-size:11px;display:inline-block;margin:2px;">${r.reaction} (${r.count})</span>`)
    .join(' ')
  
  const sexRows = stats ? Object.entries(stats.sex_distribution)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #dce0e6;">${k}</td><td style="padding:8px 12px;border-bottom:1px solid #dce0e6;">${v}</td></tr>`)
    .join('') : ''
  
  const ageRows = stats ? Object.entries(stats.age_distribution)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #dce0e6;">${k}</td><td style="padding:8px 12px;border-bottom:1px solid #dce0e6;">${v}</td></tr>`)
    .join('') : ''
  
  const outcomeRows = stats ? Object.entries(stats.outcome_distribution)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #dce0e6;">${k}</td><td style="padding:8px 12px;border-bottom:1px solid #dce0e6;">${v}</td></tr>`)
    .join('') : ''

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;padding:40px;color:#2d3748;line-height:1.5;background:#fff;">
  <div style="border-bottom:1px solid #dce0e6;padding-bottom:16px;margin-bottom:24px;">
    <h1 style="font-size:26px;font-weight:600;text-transform:capitalize;color:#1a202c;margin:0 0 4px 0;">${data.drug}</h1>
    <div style="font-size:13px;color:#64748b;">Adverse Event Summary from FDA FAERS</div>
    <div style="font-size:11px;color:#64748b;margin-top:6px;">Snapshot: ${corpusVersion}</div>
  </div>
  
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;">
    <div style="background:#f5f6f8;border:1px solid #dce0e6;border-radius:6px;padding:14px;text-align:center;">
      <div style="font-size:20px;font-weight:600;color:#1a202c;">${data.summary.total_events.toLocaleString()}</div>
      <div style="font-size:9px;color:#64748b;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Events in Corpus</div>
    </div>
    <div style="background:#f5f6f8;border:1px solid #dce0e6;border-radius:6px;padding:14px;text-align:center;">
      <div style="font-size:20px;font-weight:600;color:#1a202c;">${data.summary.total_in_fda.toLocaleString()}</div>
      <div style="font-size:9px;color:#64748b;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Total in FDA</div>
    </div>
    <div style="background:#f5f6f8;border:1px solid #dce0e6;border-radius:6px;padding:14px;text-align:center;">
      <div style="font-size:20px;font-weight:600;color:#1a202c;">${seriousPercent}%</div>
      <div style="font-size:9px;color:#64748b;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Serious Reports</div>
    </div>
    <div style="background:#f5f6f8;border:1px solid #dce0e6;border-radius:6px;padding:14px;text-align:center;">
      <div style="font-size:20px;font-weight:600;color:#1a202c;">${fatalCount.toLocaleString()}</div>
      <div style="font-size:9px;color:#64748b;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Fatal Outcomes</div>
    </div>
  </div>
  
  <div style="margin-bottom:20px;">
    <h3 style="font-size:10px;font-weight:600;color:#64748b;margin:0 0 10px 0;text-transform:uppercase;letter-spacing:0.5px;">Top Reported Reactions</h3>
    <div style="line-height:2.2;">${topReactions}</div>
  </div>
  
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:16px;">
    <div>
      <h3 style="font-size:10px;font-weight:600;color:#64748b;margin:0 0 8px 0;text-transform:uppercase;letter-spacing:0.5px;">Sex Distribution</h3>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <tr><th style="text-align:left;padding:8px 12px;background:#f5f6f8;font-weight:600;color:#64748b;font-size:9px;text-transform:uppercase;border-bottom:1px solid #dce0e6;">Sex</th><th style="text-align:left;padding:8px 12px;background:#f5f6f8;font-weight:600;color:#64748b;font-size:9px;text-transform:uppercase;border-bottom:1px solid #dce0e6;">Count</th></tr>
        ${sexRows}
      </table>
    </div>
    <div>
      <h3 style="font-size:10px;font-weight:600;color:#64748b;margin:0 0 8px 0;text-transform:uppercase;letter-spacing:0.5px;">Age Distribution</h3>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <tr><th style="text-align:left;padding:8px 12px;background:#f5f6f8;font-weight:600;color:#64748b;font-size:9px;text-transform:uppercase;border-bottom:1px solid #dce0e6;">Age Group</th><th style="text-align:left;padding:8px 12px;background:#f5f6f8;font-weight:600;color:#64748b;font-size:9px;text-transform:uppercase;border-bottom:1px solid #dce0e6;">Count</th></tr>
        ${ageRows}
      </table>
    </div>
  </div>
  
  <div style="margin-bottom:20px;">
    <h3 style="font-size:10px;font-weight:600;color:#64748b;margin:0 0 8px 0;text-transform:uppercase;letter-spacing:0.5px;">Outcome Distribution</h3>
    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <tr><th style="text-align:left;padding:8px 12px;background:#f5f6f8;font-weight:600;color:#64748b;font-size:9px;text-transform:uppercase;border-bottom:1px solid #dce0e6;">Outcome</th><th style="text-align:left;padding:8px 12px;background:#f5f6f8;font-weight:600;color:#64748b;font-size:9px;text-transform:uppercase;border-bottom:1px solid #dce0e6;">Count</th></tr>
      ${outcomeRows}
    </table>
  </div>
  
  <div style="background:#f5f6f8;border:1px solid #dce0e6;border-radius:6px;padding:14px;margin-bottom:16px;">
    <h3 style="font-size:10px;font-weight:600;color:#5a7a94;margin:0 0 10px 0;text-transform:uppercase;letter-spacing:0.5px;">Verification Data</h3>
    <div style="font-family:SF Mono,Monaco,Consolas,monospace;font-size:9px;color:#64748b;line-height:1.8;">
      <div><span style="color:#5a7a94;font-weight:500;">EVE Decision ID:</span> ${eveDecisionId}</div>
      <div><span style="color:#5a7a94;font-weight:500;">Corpus Version:</span> ${corpusVersion}</div>
      <div><span style="color:#5a7a94;font-weight:500;">Root Hash:</span> ${data.root_hash || 'N/A'}</div>
      <div><span style="color:#5a7a94;font-weight:500;">Stats Hash:</span> ${data.stats_hash || 'N/A'}</div>
    </div>
  </div>
  
  <div style="background:#f5f6f8;border:1px solid #dce0e6;border-radius:6px;padding:14px;font-size:10px;color:#64748b;line-height:1.6;margin-bottom:20px;">
    <strong style="color:#5a7a94;">Notice:</strong> This document is a visual export generated from EVE Medical Evidence. It reflects reported adverse event data from FDA FAERS and does not constitute medical advice or imply causality. Always consult qualified healthcare professionals for medical decisions.
  </div>
  
  <div style="border-top:1px solid #dce0e6;padding-top:14px;text-align:center;font-size:9px;color:#64748b;">
    <div style="color:#5a7a94;margin-bottom:4px;">Presented via EVE · Evidence & Verification Engine</div>
    <div>Snapshot: ${corpusVersion} · Generated: ${generatedDate}</div>
    <div style="margin-top:4px;">Patent Pending EVE-PAT-2026-001</div>
  </div>
</div>`
}
