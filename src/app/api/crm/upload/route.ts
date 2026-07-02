import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { requireCrmAuth } from '@/lib/dal'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
  try {
    await requireCrmAuth()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const folder = (formData.get('folder') as string) ?? 'uniflex/crm'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large — maximum 10 MB' }, { status: 413 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

  try {
    const result = await cloudinary.uploader.upload(base64, {
      folder,
      resource_type: 'auto',
    })
    return NextResponse.json({ url: result.secure_url, publicId: result.public_id, fileName: file.name })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Upload failed' }, { status: 500 })
  }
}
