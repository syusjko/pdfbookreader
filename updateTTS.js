const fs = require("fs");
let c = fs.readFileSync("app/api/tts/route.ts", "utf8");

// Change the TTS logic to use TikTok for Korean
c = c.replace(
  "if (isEnglish) {",
  "if (isEnglish || tl === 'ko' || tl === 'ja') {"
);

c = c.replace(
  "audioBuffer = await fetchTikTokAudio(chunk.trim(), 'en_male_narration');",
  "let voiceId = 'en_male_narration';\n        if (tl === 'ko') voiceId = 'kr_002'; // kr_002 is Female, kr_004 is Male\n        if (tl === 'ja') voiceId = 'jp_006';\n        audioBuffer = await fetchTikTokAudio(chunk.trim(), voiceId);"
);

fs.writeFileSync("app/api/tts/route.ts", c);
console.log("TTS Route updated");
