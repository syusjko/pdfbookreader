import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ─── TTS chunk fetcher ─────────────────────────────────────────────────────
async function fetchTikTokAudio(text: string, voice: string): Promise<Buffer | null> {
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
  } catch (e) {
    console.error('TikTok TTS error:', e);
    return null;
  }
}

async function fetchGoogleNeural2Audio(text: string, tl: string): Promise<Buffer | null> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    console.warn('GOOGLE_TTS_API_KEY is not set. Falling back to free standard Google TTS.');
    return fetchGoogleStandardAudio(text, tl);
  }

  // Map languages to Neural2 voices
  let voiceName = 'en-US-Neural2-J'; 
  if (tl === 'fr') voiceName = 'fr-FR-Neural2-B'; // French Male Neural2
  else if (tl === 'ko') voiceName = 'ko-KR-Neural2-C'; // Korean Male Neural2
  else if (tl === 'ja') voiceName = 'ja-JP-Neural2-C'; // Japanese Male Neural2

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: tl === 'fr' ? 'fr-FR' : tl === 'ko' ? 'ko-KR' : tl === 'ja' ? 'ja-JP' : 'en-US', name: voiceName },
        audioConfig: { audioEncoding: 'MP3' }
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Google Neural2 API error:', errorText);
      return fetchGoogleStandardAudio(text, tl);
    }

    const data = await res.json();
    if (!data.audioContent) throw new Error('No audioContent returned');
    
    return Buffer.from(data.audioContent, 'base64');
  } catch (e) {
    console.error('Google Neural2 exception:', e);
    return fetchGoogleStandardAudio(text, tl);
  }
}

async function fetchGoogleStandardAudio(text: string, tl: string): Promise<Buffer | null> {
  try {
    const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${tl}&client=tw-ob`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  } catch (e) {
    console.error('Google standard TTS fallback error:', e);
  }
  return null;
}

// ─── Main handler ──────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text');
    const lang = searchParams.get('lang') || 'en-US';

    if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

    const tl = lang.split('-')[0];
    const isEnglish = tl === 'en';

    const buffers: Buffer[] = [];
    
    // Chunk size limit: TikTok accepts max ~200, Google accepts ~5000. 
    // We'll chunk to 180 chars to be safe across all platforms and keep response times low.
    const MAX_CHUNK = 175;
    const subChunks: string[] = [];
    let remaining = text;
    
    while (remaining.length > MAX_CHUNK) {
      let cut = remaining.lastIndexOf(' ', MAX_CHUNK);
      if (cut < MAX_CHUNK * 0.5) cut = MAX_CHUNK;
      subChunks.push(remaining.substring(0, cut));
      remaining = remaining.substring(cut).trim();
    }
    if (remaining.trim()) subChunks.push(remaining.trim());

    for (const chunk of subChunks) {
      if (!chunk.trim()) continue;
      
      let audioBuffer: Buffer | null = null;
      
      if (isEnglish) {
        // English uses TikTok
        audioBuffer = await fetchTikTokAudio(chunk.trim(), 'en_male_narration');
      } else {
        // Non-English uses Google Cloud Neural2
        audioBuffer = await fetchGoogleNeural2Audio(chunk.trim(), tl);
      }
      
      if (audioBuffer) buffers.push(audioBuffer);
    }

    if (buffers.length === 0) {
      throw new Error('Failed to generate any audio');
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
