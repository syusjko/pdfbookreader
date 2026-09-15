/**
 * Cloudflare Worker for Microsoft Edge TTS Proxy
 * Deploy this script to your Cloudflare Workers dashboard.
 */
export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const { text, voice } = await request.json();
      
      const uuid = crypto.randomUUID().replace(/-/g, "");
      const wsUrl = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4";
      
      const wsResponse = await fetch(wsUrl, {
        headers: {
          "Origin": "chrome-extension://jdiccldimpdaibmpdkjnbnkndfdndkgc",
          "Connection": "Upgrade",
          "Upgrade": "websocket"
        }
      });
      
      if (wsResponse.status !== 101) {
        throw new Error("Failed to upgrade WebSocket");
      }
      
      const webSocket = wsResponse.webSocket;
      if (!webSocket) {
        throw new Error("No WebSocket in response");
      }
      
      webSocket.accept();
      
      const config = `X-Timestamp:${Date.now()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
      webSocket.send(config);
      
      const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='${voice}'><prosody rate='+0%'>${text}</prosody></voice></speak>`;
      const ssmlMsg = `X-RequestId:${uuid}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${Date.now()}\r\nPath:ssml\r\n\r\n${ssml}`;
      webSocket.send(ssmlMsg);
      
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      
      webSocket.addEventListener("message", async (event) => {
        if (typeof event.data === "string") {
          if (event.data.includes("Path:turn.end")) {
            webSocket.close();
            writer.close();
          }
        } else {
          const buf = new Uint8Array(event.data);
          let headerEnd = -1;
          for (let i = 0; i < buf.length - 3; i++) {
            if (buf[i]===13 && buf[i+1]===10 && buf[i+2]===13 && buf[i+3]===10) {
              headerEnd = i + 4;
              break;
            }
          }
          if (headerEnd !== -1) {
            writer.write(buf.slice(headerEnd));
          }
        }
      });
      
      webSocket.addEventListener("error", (err) => {
        writer.abort(err);
      });
      
      return new Response(readable, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Access-Control-Allow-Origin": "*"
        }
      });
      
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }
};
