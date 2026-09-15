import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Max execution time for Vercel Hobby

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    const lang = searchParams.get('lang') || 'en-US';
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Route ALL languages to Google Cloud TTS backend (Google Translate TTS API)
    // Hugging Face ZeroGPU spaces are too unstable and rate-limited for Vercel production.
    const tl = lang.split('-')[0]; // en, fr, ko, ja
    
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${tl}&client=tw-ob`;

    const audioRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' // Prevent 403
      }
    });

    if (!audioRes.ok) {
      throw new Error(`GTTS failed: ${audioRes.status}`);
    }

    const buffer = await audioRes.arrayBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      }
    });

  } catch (err: any) {
    console.error('TTS error:', err?.message || String(err));
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
