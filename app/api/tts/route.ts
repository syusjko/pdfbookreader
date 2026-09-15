import { EdgeTTS } from 'node-edge-tts';
import { readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    const voice = searchParams.get('voice');
    const lang = searchParams.get('lang');

    if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

    const tts = new EdgeTTS({ voice: voice || 'en-US-JennyNeural', lang: lang || 'en-US' });
    const tmpFile = join(tmpdir(), `tts-${Date.now()}-${Math.floor(Math.random() * 10000)}.mp3`);
    
    await tts.ttsPromise(text, tmpFile);
    
    const buffer = readFileSync(tmpFile);
    try { unlinkSync(tmpFile); } catch(e) {}
    
    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Length': String(buffer.length)
      }
    });
  } catch (err: any) {
    console.error('TTS error:', err?.message || String(err));
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
