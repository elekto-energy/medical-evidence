interface Props {
  data: Record<string, number>
  colorMap?: Record<string, string>
}

export function BarChart({ data, colorMap = {} }: Props) {
  const entries = Object.entries(data).filter(([, v]) => v > 0)
  const max = Math.max(...entries.map(([, v]) => v), 1)
  
  return (
    <div className="space-y-2">
      {entries.map(([label, value]) => {
        const percent = (value / max) * 100
        const color = colorMap[label] || 'bg-gradient-to-r from-eve-accent to-eve-blue'
        
        return (
          <div key={label} className="flex items-center gap-3">
            <div className="w-24 text-xs text-eve-muted text-right truncate">{label}</div>
            <div className="flex-1 h-5 bg-eve-card rounded relative overflow-hidden">
              <div 
                className={`h-full rounded ${color}`} 
                style={{ width: `${percent}%` }}
              />
              <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium ${percent < 20 ? 'text-eve-muted' : 'text-white'}`}>
                {value}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
