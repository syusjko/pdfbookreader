export const runtime = "edge";
export const dynamic = "force-dynamic";

const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const CHROMIUM_FULL_VERSION = "130.0.2849.68";

async function generateSecMsGecToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const rounded = Math.floor(now / 300) * 300;
  const message = `${rounded}:${TRUSTED_CLIENT_TOKEN}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text") || "";
  const voice = searchParams.get("voice") || "en-US-JennyNeural";
  const lang = searchParams.get("lang") || "en-US";

  if (!text) {
    return new Response(JSON.stringify({ error: "No text" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const secMsGec = await generateSecMsGecToken();
  const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=1-${CHROMIUM_FULL_VERSION}`;

  return new Promise<Response>((resolve) => {
    const ws = new WebSocket(wsUrl);
    const audioChunks: Uint8Array[] = [];
    let totalSize = 0;
    const requestId = crypto.randomUUID().replace(/-/g, "");
    const timestamp = new Date().toISOString();
    let resolved = false;

    const done = (resp: Response) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        try { ws.close(); } catch {}
        resolve(resp);
      }
    };

    const timer = setTimeout(() => {
      done(new Response(JSON.stringify({ error: "TTS timeout" }), {
        status: 504,
        headers: { "Content-Type": "application/json" },
      }));
    }, 9000);

    ws.onopen = () => {
      ws.send(
        `X-Timestamp:${timestamp}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n` +
        `{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`
      );
      const escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
      const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${lang}"><voice name="${voice}"><prosody rate="-25%">${escaped}</prosody></voice></speak>`;
      ws.send(
        `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`
      );
    };

    ws.onmessage = (event: MessageEvent) => {
      if (typeof event.data === "string") {
        if (event.data.includes("Path:turn.end")) {
          const merged = new Uint8Array(totalSize);
          let offset = 0;
          for (const chunk of audioChunks) {
            merged.set(chunk, offset);
            offset += chunk.byteLength;
          }
          done(new Response(merged.buffer, {
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "no-store",
              "Content-Length": String(totalSize),
            },
          }));
        }
      } else if (event.data instanceof ArrayBuffer) {
        const view = new DataView(event.data);
        const headerLen = view.getUint16(0);
        const audioData = new Uint8Array(event.data, 2 + headerLen);
        if (audioData.byteLength > 0) {
          audioChunks.push(audioData);
          totalSize += audioData.byteLength;
        }
      }
    };

    ws.onerror = () => {
      done(new Response(JSON.stringify({ error: "WebSocket error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }));
    };
  });
}
