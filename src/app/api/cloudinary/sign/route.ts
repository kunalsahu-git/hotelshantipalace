import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { guestId, side } = body as { guestId?: string; side?: string };

  if (!guestId || (side !== 'front' && side !== 'back')) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!apiSecret || !apiKey || !cloudName) {
    console.error('Cloudinary env vars missing');
    return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `hotel-shanti/guests/${guestId}`;
  const publicId = `id-${side}`;

  // Params must be sorted alphabetically, then secret appended (no & before secret)
  const toSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash('sha256').update(toSign).digest('hex');

  return NextResponse.json({ signature, timestamp, apiKey, cloudName, folder, publicId });
}
