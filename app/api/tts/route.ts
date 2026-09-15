import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function chunkString(str: string, maxLen: number): string[] {
  const chunks = [];
  let i = 0;
  while (i < str.length) {
    let chunk = str.substring(i, i + maxLen);
    // try to break at space
    if (i + maxLen < str.length) {
      let lastSpace = chunk.lastIndexOf(' ');
      if (lastSpace > maxLen * 0.5) {
        chunk = chunk.substring(0, lastSpace);
      }
    }
    chunks.push(chunk);
    i += chunk.length;
  }
  return chunks;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    const lang = searchParams.get('lang') || 'en-US';
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const tl = lang.split('-')[0]; // en, fr, ko, ja
    
    // Google TTS has a strict 200 character limit per request. 
    // We chunk the text safely into <190 char segments.
    const chunks = chunkString(text, 180);
    
    const buffers: Buffer[] = [];
    
    for (const chunk of chunks) {
      const encodedText = encodeURIComponent(chunk.trim());
      if (!encodedText) continue;
      
      const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${tl}&client=tw-ob`;

      const audioRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' 
        }
      });

      if (!audioRes.ok) {
        throw new Error(`GTTS failed: ${audioRes.status}`);
      }
      
      const arrayBuf = await audioRes.arrayBuffer();
      buffers.push(Buffer.from(arrayBuf));
    }
    
    const finalBuffer = Buffer.concat(buffers);

    return new Response(finalBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': String(finalBuffer.byteLength)
      }
    });

  } catch (err: any) {
    console.error('TTS error:', err?.message || String(err));
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
