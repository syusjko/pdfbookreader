import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ─── Silence buffer factory ────────────────────────────────────────────────
// Generates a minimal valid MP3 frame filled with silence.
// Each MP3 frame at 44100Hz stereo is 1152 samples = ~26ms.
// We create enough frames to fill the requested duration (ms).
function makeSilenceBuffer(durationMs: number): Buffer {
  // Minimal valid MP3 silence frame (MPEG1 Layer3 64kbps, 44100Hz, stereo, no audio)
  const SILENCE_FRAME = Buffer.from([
    0xFF, 0xFB, 0x90, 0x00, // Frame sync + header (MPEG1, Layer3, 128kbps, 44100Hz, stereo)
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);
  const FRAME_DURATION_MS = 26; // ~26ms per frame at 44100Hz
  const count = Math.ceil(durationMs / FRAME_DURATION_MS);
  return Buffer.concat(Array(count).fill(SILENCE_FRAME));
}

// ─── Natural pause splitter ────────────────────────────────────────────────
// Splits a sentence into sub-segments at natural pause points.
// Returns [{text, pauseAfterMs}] where pauseAfterMs is silence to insert AFTER.
interface Segment {
  text: string;
  pauseAfterMs: number;
}

function splitIntoPauseSegments(sentence: string): Segment[] {
  const segments: Segment[] = [];

  // Split at strong pause markers first (em dash, colon, semicolon)
  // then at weaker markers (comma).
  // Regex splits but keeps the delimiter character.
  const parts = sentence.split(/([,;:\u2014\u2013])/g);

  let current = '';
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (/^[,;:\u2014\u2013]$/.test(part)) {
      // This is a delimiter
      current += part;
      const isStrong = /[;:\u2014\u2013]/.test(part);
      const pauseMs = isStrong ? 320 : 220;
      if (current.trim().length > 0) {
        segments.push({ text: current.trim(), pauseAfterMs: pauseMs });
      }
      current = '';
    } else {
      current += part;
    }
  }
  // Remaining text (no trailing pause – the 400ms onEnded gap handles end-of-sentence)
  if (current.trim().length > 0) {
    segments.push({ text: current.trim(), pauseAfterMs: 0 });
  }

  return segments;
}

// ─── TTS chunk fetcher ─────────────────────────────────────────────────────
async function fetchTikTokAudio(text: string, voice: string, tl: string): Promise<Buffer | null> {
  try {
    const tRes = await fetch('https://tiktok-tts.weilnet.workers.dev/api/generation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice })
    });
    if (!tRes.ok) throw new Error('TikTok API error');
    const data = await tRes.json();
    if (data.error || !data.data) throw new Error('No data');
    return Buffer.from(data.data, 'base64');
  } catch {
    // Fallback: Google TTS
    try {
      const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${tl}&client=tw-ob`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    } catch {}
    return null;
  }
}

// ─── Main handler ──────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    const lang = searchParams.get('lang') || 'en-US';

    if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

    const tl = lang.split('-')[0];

    let voice = 'en_male_narration';
    if (tl === 'fr') voice = 'fr_001';
    else if (tl === 'ko') voice = 'kr_004';
    else if (tl === 'ja') voice = 'jp_006';

    const buffers: Buffer[] = [];
    const segments = splitIntoPauseSegments(text);

    // Keep sub-segments under 180 chars for TikTok API
    const MAX_CHUNK = 175;
    for (const seg of segments) {
      // Further split long sub-segments by word boundary
      const subChunks: string[] = [];
      let remaining = seg.text;
      while (remaining.length > MAX_CHUNK) {
        const cut = remaining.lastIndexOf(' ', MAX_CHUNK);
        if (cut < MAX_CHUNK * 0.5) {
          subChunks.push(remaining.substring(0, MAX_CHUNK));
          remaining = remaining.substring(MAX_CHUNK);
        } else {
          subChunks.push(remaining.substring(0, cut));
          remaining = remaining.substring(cut + 1);
        }
      }
      if (remaining.trim()) subChunks.push(remaining.trim());

      for (const chunk of subChunks) {
        if (!chunk.trim()) continue;
        const audio = await fetchTikTokAudio(chunk.trim(), voice, tl);
        if (audio) buffers.push(audio);
      }

      // Insert silence pause AFTER this segment if requested
      if (seg.pauseAfterMs > 0) {
        buffers.push(makeSilenceBuffer(seg.pauseAfterMs));
      }
    }

    const final = Buffer.concat(buffers);
    return new Response(final, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': String(final.byteLength)
      }
    });

  } catch (err: any) {
    console.error('TTS error:', err?.message || String(err));
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
