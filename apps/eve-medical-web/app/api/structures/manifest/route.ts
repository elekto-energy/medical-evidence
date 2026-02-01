import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  const corpus = request.nextUrl.searchParams.get('corpus') || 'v20260131-01'
  
  const manifestPath = path.join(
    process.cwd(), '..', '..', 'data', 'corpus', corpus, 'structures_manifest.json'
  )
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    return NextResponse.json(manifest)
  } catch (err) {
    return NextResponse.json({ error: 'Manifest not found' }, { status: 404 })
  }
}
