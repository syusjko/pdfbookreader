import { NextResponse } from 'next/server';
import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    const lang = searchParams.get('lang') || 'en-US';
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Determine high-quality Azure Neural voice based on language
    let voice = 'en-US-AriaNeural'; // Default English
    if (lang.startsWith('en')) {
      voice = 'en-US-AriaNeural';
    } else if (lang.startsWith('fr')) {
      voice = 'fr-FR-DeniseNeural';
    } else if (lang.startsWith('ko')) {
      voice = 'ko-KR-SunHiNeural';
    } else if (lang.startsWith('ja')) {
      voice = 'ja-JP-NanamiNeural';
    } else if (lang.startsWith('es')) {
      voice = 'es-ES-ElviraNeural';
    }

    const tts = new EdgeTTS({
      voice: voice,
      lang: lang,
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
    });

    const tmpDir = os.tmpdir();
    const tmpFile = path.join(tmpDir, `${crypto.randomUUID()}.mp3`);

    await tts.ttsPromise(text, tmpFile);

    const buffer = fs.readFileSync(tmpFile);
    fs.unlinkSync(tmpFile); // Clean up immediately

    return new Response(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': String(buffer.byteLength)
      }
    });

  } catch (err: any) {
    console.error('TTS error:', err?.message || String(err));
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
