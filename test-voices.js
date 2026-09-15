// Since we can't test browser voices in Node, we will just write the logic that we would put in the frontend.
function getBestVoice(lang, voices) {
  // lang is 'en-US', 'fr-FR', 'ko-KR', 'ja-JP'
  const langVoices = voices.filter(v => v.lang.startsWith(lang.split('-')[0]));
  if (langVoices.length === 0) return null;

  // 1. Prioritize Microsoft "Natural" voices (Windows 11 / Edge)
  const naturalVoice = langVoices.find(v => v.name.includes("Natural"));
  if (naturalVoice) return naturalVoice;

  // 2. Prioritize Apple "Premium" or "Enhanced" voices (macOS / iOS)
  const premiumVoice = langVoices.find(v => v.name.includes("Premium") || v.name.includes("Enhanced"));
  if (premiumVoice) return premiumVoice;
  
  // 3. Google voices
  const googleVoice = langVoices.find(v => v.name.includes("Google"));
  if (googleVoice) return googleVoice;

  // 4. Default to whatever is first
  return langVoices[0];
}
