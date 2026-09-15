const http = require('http');
const html = `<!DOCTYPE html><html><body><script>
const ws = new WebSocket('wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4');
ws.onopen = () => { fetch('/log?e=success'); ws.close(); };
ws.onerror = (e) => fetch('/log?e=error');
</script></body></html>`;
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/log')) { console.log(req.url); process.exit(0); }
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});
server.listen(3003, () => {
  require('child_process').exec('start http://localhost:3003');
});
