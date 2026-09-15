import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function chunkString(str: string, maxLen: number): string[] {
  const chunks = [];
  let i = 0;
  while (i < str.length) {
    let chunk = str.substring(i, i + maxLen);
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
    
    // Select high-quality TikTok Neural Voice
    let voice = 'en_male_narration'; // Professional Audiobook Narrator (English)
    if (tl === 'fr') voice = 'fr_001'; // French Calm Male
    else if (tl === 'ko') voice = 'kr_004'; // Korean Calm Male
    else if (tl === 'ja') voice = 'jp_006'; // Japanese Calm Male

    const chunks = chunkString(text, 180);
    const buffers: Buffer[] = [];
    
    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      
      try {
        // Try TikTok TTS First (Neural Voice)
        const tRes = await fetch('https://tiktok-tts.weilnet.workers.dev/api/generation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: chunk.trim(), voice })
        });
        
        if (!tRes.ok) throw new Error('TikTok API error');
        const data = await tRes.json();
        
        if (data.error || !data.data) {
          throw new Error('TikTok generation failed');
        }
        
        buffers.push(Buffer.from(data.data, 'base64'));
      } catch (e) {
        // Fallback to Google TTS (Standard Voice) if Neural fails
        console.warn('TikTok TTS failed, falling back to Google TTS:', e);
        const encodedText = encodeURIComponent(chunk.trim());
        const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${tl}&client=tw-ob`;

        const audioRes = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        if (audioRes.ok) {
          buffers.push(Buffer.from(await audioRes.arrayBuffer()));
        }
      }
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
