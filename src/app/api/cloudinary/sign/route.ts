import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { guestId, side } = body as { guestId?: string; side?: string; guestIndex?: number };

  if (!guestId || (side !== 'front' && side !== 'back')) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  // Trim all values — copy-pasting from Cloudinary dashboard often adds whitespace
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();

  if (!apiSecret || !apiKey || !cloudName) {
    console.error('[cloudinary/sign] Missing env vars:', {
      hasSecret: !!apiSecret,
      hasKey: !!apiKey,
      hasCloudName: !!cloudName,
    });
    return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
  }

  // Log secret length + first/last char to help debug wrong-value issues (never logs the full secret)
  console.log('[cloudinary/sign] secret check:', {
    length: apiSecret.length,
    first: apiSecret[0],
    last: apiSecret[apiSecret.length - 1],
    cloudName,
    apiKeyPrefix: apiKey.slice(0, 6),
  });

  const guestIndex = typeof body.guestIndex === 'number' ? body.guestIndex : 0;

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `hotel-shanti/guests/${guestId}`;
  // Primary guest uses id-front/id-back; additional guests use guest-N-id-front/back
  const publicId = guestIndex === 0 ? `id-${side}` : `guest-${guestIndex}-id-${side}`;

  // Cloudinary signature: params sorted alphabetically, secret appended without separator
  // Excluded params: api_key, file, resource_type, signature, type
  const toSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash('sha256').update(toSign).digest('hex');

  return NextResponse.json({ signature, timestamp, apiKey, cloudName, folder, publicId });
}
