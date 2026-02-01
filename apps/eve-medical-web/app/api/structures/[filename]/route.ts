import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const corpus = request.nextUrl.searchParams.get('corpus') || 'v20260131-01'
  const filename = params.filename
  
  if (!filename.endsWith('.sdf')) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }
  
  const sdfPath = path.join(
    process.cwd(), '..', '..', 'data', 'corpus', corpus, 'structures', filename
  )
  
  try {
    const sdf = fs.readFileSync(sdfPath, 'utf-8')
    return new NextResponse(sdf, {
      headers: { 'Content-Type': 'chemical/x-mdl-sdfile' }
    })
  } catch (err) {
    return NextResponse.json({ error: 'Structure not found' }, { status: 404 })
  }
}
