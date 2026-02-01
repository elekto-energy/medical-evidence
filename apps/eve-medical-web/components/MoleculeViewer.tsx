'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  drugName: string
  corpusVersion?: string
  className?: string
}

export function MoleculeViewer({ drugName, corpusVersion = 'v20260131-01', className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [structureInfo, setStructureInfo] = useState<{ cid: number; hash: string } | null>(null)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      if (!containerRef.current) return

      try {
        // 1. Load manifest to get filename and hash
        const manifestRes = await fetch(`/api/structures/manifest?corpus=${corpusVersion}`)
        if (!manifestRes.ok) throw new Error('Could not load manifest')
        const manifest = await manifestRes.json()
        
        const structure = manifest.structures.find(
          (s: any) => s.drug.toLowerCase() === drugName.toLowerCase()
        )
        
        if (!structure) {
          setError('No structure in corpus')
          setLoading(false)
          return
        }

        // 2. Load SDF from corpus
        const sdfRes = await fetch(`/api/structures/${structure.file}?corpus=${corpusVersion}`)
        if (!sdfRes.ok) throw new Error('Could not load structure')
        const sdfData = await sdfRes.text()

        if (!mounted) return

        // 3. Import and render 3Dmol
        const $3Dmol = (await import('3dmol')).default || await import('3dmol')
        
        containerRef.current.innerHTML = ''
        
        const viewer = $3Dmol.createViewer(containerRef.current, {
          backgroundColor: '#f8f8f8',
          antialias: true,
        })

        viewer.addModel(sdfData, 'sdf')
        viewer.setStyle({}, {
          stick: { radius: 0.12, color: '#5a7a94' },
          sphere: { 
            radius: 0.3,
            colorscheme: {
              prop: 'elem',
              map: {
                'C': '#6b7280', 'H': '#d1d5db', 'O': '#7d9eb5',
                'N': '#64748b', 'S': '#8b8c6e', 'F': '#6e8c7a',
                'Cl': '#7a8c6e', 'Br': '#8c6e7a', 'P': '#8b7355',
              }
            }
          }
        })
        
        viewer.zoomTo()
        viewer.render()
        
        setStructureInfo({ cid: structure.cid, hash: structure.sha256 })
        setLoading(false)
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load')
          setLoading(false)
        }
      }
    }

    init()
    return () => { mounted = false }
  }, [drugName, corpusVersion])

  return (
    <div className={className}>
      <p className="text-xs text-eve-muted mb-3 leading-relaxed">
        This visualization shows the molecular structure for identification purposes only.
        It does not represent pharmacological effect, safety, or clinical relevance.
      </p>
      
      <div className="relative bg-[#f8f8f8] rounded-lg border border-eve-border overflow-hidden" style={{ height: '200px' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-eve-muted">Loading structure...</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-eve-muted">{error}</span>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>
      
      {!loading && !error && structureInfo && (
        <div className="mt-2 text-[10px] text-eve-muted space-y-1">
          <div className="flex justify-between">
            <span>PubChem CID {structureInfo.cid}</span>
            <span>Drag to rotate · Scroll to zoom</span>
          </div>
          <div className="font-mono truncate" title={structureInfo.hash}>
            Hash: {structureInfo.hash.slice(0, 24)}...
          </div>
        </div>
      )}
    </div>
  )
}
