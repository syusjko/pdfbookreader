import { EdgeTTS } from 'node-edge-tts';
import { readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, voice, lang } = await req.json();
    if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

    const tts = new EdgeTTS({ voice: voice || 'en-US-JennyNeural', lang: lang || 'en-US' });
    const tmpFile = join(tmpdir(), `tts-${Date.now()}-${Math.floor(Math.random() * 10000)}.mp3`);
    
    await tts.ttsPromise(text, tmpFile);
    
    const buffer = readFileSync(tmpFile);
    try { unlinkSync(tmpFile); } catch(e) {}
    
    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
