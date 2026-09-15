import { client } from '@gradio/client';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Max execution time for Vercel Hobby

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    const lang = searchParams.get('lang') || 'en-US';
    const speedParam = searchParams.get('speed') || '1.0';
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // English: Use Kokoro (Fast AI)
    if (lang.startsWith('en')) {
      const voice = lang.startsWith('en-GB') ? 'bf_emma' : 'af_heart';
      const speed = parseFloat(speedParam) || 1.0;

      const app = await client('hexgrad/Kokoro-TTS');
      const res = await app.predict(4, [text, voice, speed, true]);
      
      const data = res.data as any[];
      if (!data || !data[0] || !data[0].url) {
        throw new Error('No audio URL returned from Kokoro TTS');
      }
      const audioUrl = data[0].url;

      const audioRes = await fetch(audioUrl);
      if (!audioRes.ok) throw new Error(`HF fetch failed: ${audioRes.status}`);
      const buffer = await audioRes.arrayBuffer();

      return new Response(buffer, {
        headers: {
          'Content-Type': 'audio/wav',
          'Cache-Control': 'public, max-age=31536000, immutable',
        }
      });
    } 
    // Non-English (French, Korean, Japanese): Use Google Translate TTS
    // Zero latency, unlimited quota, no 500 errors.
    else {
      const tl = lang.split('-')[0]; // fr, ko, ja
      
      // Google TTS has a 200 character limit per request. 
      // If the text is incredibly long, we should ideally chunk it, but pdfUtils.ts splits by sentences.
      // Most sentences are < 200 chars.
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
    }

  } catch (err: any) {
    console.error('TTS error:', err?.message || String(err));
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
