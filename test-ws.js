const crypto = require('crypto');
async function synthesize(text, voice) {
  const ws = new WebSocket('wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4', undefined, {
     headers: {
       'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbnkndfdndkgc'
     }
  });
  
  return new Promise((resolve, reject) => {
    const audioChunks = [];
    ws.onopen = () => {
      console.log('Connected');
      const reqId = crypto.randomUUID().replace(/-/g, '');
      const config = `X-Timestamp:${Date.now()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
      ws.send(config);
      
      const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='${voice}'><prosody rate='+0%'>${text}</prosody></voice></speak>`;
      const ssmlMsg = `X-RequestId:${reqId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${Date.now()}\r\nPath:ssml\r\n\r\n${ssml}`;
      ws.send(ssmlMsg);
    };
    
    ws.onmessage = async (e) => {
      if (typeof e.data === 'string') {
        if (e.data.includes('Path:turn.end')) {
          ws.close();
          resolve(Buffer.concat(audioChunks));
        }
      } else {
        // Node's WebSocket gives Buffer or Blob depending on the implementation
        const buf = Buffer.isBuffer(e.data) ? e.data : Buffer.from(await e.data.arrayBuffer());
        const headerEnd = buf.indexOf('\r\n\r\n') + 4;
        audioChunks.push(buf.subarray(headerEnd));
      }
    };
    ws.onerror = reject;
  });
}
synthesize('Hello from browser WebSocket implementation!', 'en-US-AriaNeural').then(b => {
  console.log('Audio received:', b.length, 'bytes');
  process.exit(0);
}).catch(console.error);
