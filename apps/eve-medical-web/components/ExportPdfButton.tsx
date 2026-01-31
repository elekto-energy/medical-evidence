'use client'

import { useState } from 'react'
import type { QueryResponse } from '@/lib/types'

interface Props {
  data: QueryResponse
}

export function ExportPdfButton({ data }: Props) {
  const [loading, setLoading] = useState(false)
  
  const exportPdf = async () => {
    setLoading(true)
    
    // Create printable HTML
    const html = generateReportHtml(data)
    
    // Open in new window for printing
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
    
    setLoading(false)
  }
  
  return (
    <button
      onClick={exportPdf}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-eve-card border border-eve-border rounded-lg hover:border-eve-accent transition disabled:opacity-50"
    >
      📄 {loading ? 'Generating...' : 'Export PDF'}
    </button>
  )
}

function generateReportHtml(data: QueryResponse): string {
  const stats = data.stats
  const seriousPercent = stats 
    ? Math.round((stats.seriousness.serious / (stats.seriousness.serious + stats.seriousness.non_serious)) * 100)
    : 0
  const fatalCount = stats?.outcome_distribution['Fatal'] || 0
  
  const topReactions = data.summary.top_reactions.slice(0, 10)
    .map(r => `<span style="background:#f0f0f0;padding:4px 8px;border-radius:4px;margin:2px;display:inline-block;">${r.reaction} (${r.count})</span>`)
    .join('')
  
  const sexRows = stats ? Object.entries(stats.sex_distribution)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
    .join('') : ''
  
  const ageRows = stats ? Object.entries(stats.age_distribution)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
    .join('') : ''
  
  const outcomeRows = stats ? Object.entries(stats.outcome_distribution)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
    .join('') : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>EVE Medical Evidence - ${data.drug}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
    h1 { font-size: 24px; margin-bottom: 8px; text-transform: capitalize; }
    h2 { font-size: 14px; color: #666; margin-bottom: 24px; }
    h3 { font-size: 12px; font-weight: 600; color: #333; margin: 16px 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #00d4aa; padding-bottom: 16px; margin-bottom: 24px; }
    .logo { font-size: 12px; color: #00d4aa; font-weight: 600; }
    .badge { background: #00d4aa; color: #000; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-box { background: #f5f5f5; border-radius: 8px; padding: 16px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: 700; color: #00a88a; }
    .stat-value.fatal { color: #e53e3e; }
    .stat-label { font-size: 10px; color: #666; margin-top: 4px; }
    .section { margin-bottom: 24px; }
    .reactions { line-height: 2; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e0e0e0; }
    th { background: #f5f5f5; font-weight: 600; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .verification { background: #f0faf8; border: 1px solid #00d4aa; border-radius: 8px; padding: 16px; margin-top: 24px; }
    .verification h3 { color: #00a88a; margin-top: 0; }
    .hash { font-family: monospace; font-size: 9px; color: #666; word-break: break-all; margin: 4px 0; }
    .disclaimer { background: #fff8e6; border: 1px solid #f0c000; border-radius: 8px; padding: 16px; margin-top: 24px; font-size: 11px; color: #856404; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e0e0e0; font-size: 10px; color: #999; text-align: center; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">EVE MEDICAL EVIDENCE</div>
      <h1>${data.drug}</h1>
      <h2>Adverse Event Report · Corpus ${data.corpus_version}</h2>
    </div>
    <div class="badge">✓ VERIFIED</div>
  </div>
  
  <div class="stats-grid">
    <div class="stat-box">
      <div class="stat-value">${data.summary.total_events}</div>
      <div class="stat-label">Events in Corpus</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${data.summary.total_in_fda.toLocaleString()}</div>
      <div class="stat-label">Total in FDA</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${seriousPercent}%</div>
      <div class="stat-label">Serious Reports</div>
    </div>
    <div class="stat-box">
      <div class="stat-value fatal">${fatalCount}</div>
      <div class="stat-label">Fatal Outcomes</div>
    </div>
  </div>
  
  <div class="section">
    <h3>Top Reported Reactions</h3>
    <div class="reactions">${topReactions}</div>
  </div>
  
  <div class="two-col">
    <div class="section">
      <h3>Sex Distribution</h3>
      <table>
        <tr><th>Sex</th><th>Count</th></tr>
        ${sexRows}
      </table>
    </div>
    <div class="section">
      <h3>Age Distribution</h3>
      <table>
        <tr><th>Age Group</th><th>Count</th></tr>
        ${ageRows}
      </table>
    </div>
  </div>
  
  <div class="section">
    <h3>Outcome Distribution</h3>
    <table>
      <tr><th>Outcome</th><th>Count</th></tr>
      ${outcomeRows}
    </table>
  </div>
  
  <div class="verification">
    <h3>🔐 Verification Data</h3>
    <div class="hash"><strong>Corpus Version:</strong> ${data.corpus_version}</div>
    <div class="hash"><strong>Root Hash:</strong> ${data.root_hash}</div>
    <div class="hash"><strong>Stats Hash:</strong> ${data.stats_hash || 'N/A'}</div>
    <div class="hash"><strong>Response Hash:</strong> ${data.response_hash}</div>
  </div>
  
  <div class="disclaimer">
    <strong>⚠️ Disclaimer:</strong> ${data.disclaimer}
    <br><br>
    <strong>Stats Disclaimer:</strong> ${data.stats_disclaimer || 'Based on reported adverse events in FDA FAERS. This visualization does not imply causality or risk.'}
  </div>
  
  <div class="footer">
    <p>EVE Medical Evidence · Patent Pending EVE-PAT-2026-001 · Generated ${new Date().toISOString().slice(0, 10)}</p>
    <p>© 2026 Organiq Sweden AB</p>
  </div>
</body>
</html>
`
}
