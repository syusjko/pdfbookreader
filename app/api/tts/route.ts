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
    const chunks = chunkString(text, 180);
    const buffers: Buffer[] = [];
    
    // 1. Check if user deployed Cloudflare Worker Proxy
    // If you deployed the worker, set CF_WORKER_URL in your Vercel Environment Variables
    const cfWorkerUrl = process.env.CF_WORKER_URL || "https://edge-tts-proxy.jsyusjko.workers.dev";

    if (cfWorkerUrl) {
      let edgeVoice = 'en-US-AriaNeural';
      if (tl === 'fr') edgeVoice = 'fr-FR-HenriNeural'; // Deep French Male
      else if (tl === 'ko') edgeVoice = 'ko-KR-InJoonNeural'; // Deep Korean Male
      else if (tl === 'ja') edgeVoice = 'ja-JP-KeitaNeural'; // Deep Japanese Male

      for (const chunk of chunks) {
        if (!chunk.trim()) continue;
        const res = await fetch(cfWorkerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: chunk.trim(), voice: edgeVoice })
        });
        if (res.ok) buffers.push(Buffer.from(await res.arrayBuffer()));
      }
    } 
    // 2. Fallback to TikTok API (if Cloudflare Worker is not set)
    else {
      let voice = 'en_male_narration'; 
      if (tl === 'fr') voice = 'fr_001'; 
      else if (tl === 'ko') voice = 'kr_004'; 
      else if (tl === 'ja') voice = 'jp_006'; 

      for (const chunk of chunks) {
        if (!chunk.trim()) continue;
        try {
          const tRes = await fetch('https://tiktok-tts.weilnet.workers.dev/api/generation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: chunk.trim(), voice })
          });
          if (!tRes.ok) throw new Error();
          const data = await tRes.json();
          if (data.error || !data.data) throw new Error();
          buffers.push(Buffer.from(data.data, 'base64'));
        } catch (e) {
          const encodedText = encodeURIComponent(chunk.trim());
          const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${tl}&client=tw-ob`;
          const audioRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
          if (audioRes.ok) buffers.push(Buffer.from(await audioRes.arrayBuffer()));
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
