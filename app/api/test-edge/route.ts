export const runtime = 'edge';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const url = "https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4";
    const response = await fetch(url, {
      headers: {
        "Origin": "chrome-extension://jdiccldimpdaibmpdkjnbnkndfdndkgc",
        "Connection": "Upgrade",
        "Upgrade": "websocket"
      }
    });

    if (response.status !== 101) {
      return NextResponse.json({ error: 'Failed to upgrade', status: response.status });
    }

    const ws = (response as any).webSocket;
    if (!ws) {
      return NextResponse.json({ error: 'No webSocket on response' });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
