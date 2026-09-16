const fs = require("fs");
let c = fs.readFileSync("components/AuthPlayer.tsx", "utf8");

c = c.replace(
  "const apiUrl = `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(bookLang)}&speed=${encodeURIComponent(readingSpeed)}&_t=${sessionToken}`;",
  "const apiUrl = `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(bookLang)}&speed=${encodeURIComponent(readingSpeed)}`;"
);
// Also remove sessionToken variable since it's unused now
c = c.replace("const sessionToken = useRef(Date.now()).current;\n", "");

fs.writeFileSync("components/AuthPlayer.tsx", c);
console.log("TTS cache busting removed.");
