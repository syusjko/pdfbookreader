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

    let audioUrl = '';

    // Route based on language
    if (lang.startsWith('ko') || lang.startsWith('fr')) {
      // Use Suno Bark for Korean and French (High quality multilingual)
      const barkVoice = lang.startsWith('ko') ? 'Speaker 0 (ko)' : 'Speaker 0 (fr)';
      const app = await client('suno/bark');
      
      const res = await app.predict('gen_tts', [text, barkVoice]);
      const data = res.data as any[];
      if (!data || !data[0] || !data[0].url) {
        throw new Error('No audio URL returned from Bark TTS');
      }
      audioUrl = data[0].url;
      
    } else {
      // Use Kokoro-82M for English (Extremely fast and high quality)
      const voice = lang.startsWith('en-GB') ? 'bf_emma' : 'af_heart';
      const speed = parseFloat(speedParam) || 1.0;

      const app = await client('hexgrad/Kokoro-TTS');
      const res = await app.predict(4, [text, voice, speed, true]);
      
      const data = res.data as any[];
      if (!data || !data[0] || !data[0].url) {
        throw new Error('No audio URL returned from Kokoro TTS');
      }
      audioUrl = data[0].url;
    }

    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) {
      throw new Error(`Failed to fetch audio from HF Space: ${audioRes.status}`);
    }
    
    const buffer = await audioRes.arrayBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': String(buffer.byteLength)
      }
    });

  } catch (err: any) {
    console.error('TTS error:', err?.message || String(err));
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
