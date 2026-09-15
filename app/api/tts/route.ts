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

    let voice = 'af_heart'; // Default English
    if (lang.startsWith('fr')) voice = 'ff_siwis';
    
    const speed = parseFloat(speedParam) || 1.0;

    const app = await client('hexgrad/Kokoro-TTS');
    const res = await app.predict(4, [text, voice, speed, true]);
    
    const data = res.data as any[];
    if (!data || !data[0] || !data[0].url) {
      throw new Error('No audio URL returned from Kokoro TTS');
    }

    // Fetch the generated audio file from the HF Space URL
    const audioRes = await fetch(data[0].url);
    if (!audioRes.ok) {
      throw new Error(`Failed to fetch audio from HF Space: ${audioRes.status}`);
    }
    
    const buffer = await audioRes.arrayBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Length': String(buffer.byteLength)
      }
    });

  } catch (err: any) {
    console.error('Kokoro TTS error:', err?.message || String(err));
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
