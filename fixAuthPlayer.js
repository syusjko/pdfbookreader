const fs = require("fs");
let content = fs.readFileSync("components/AuthPlayer.tsx", "utf8");

content = content.replace(/isAuth: true\.trim\(\)/g, "true");
content = content.replace(/if \(!isAuth: true/g, "if (!true");
content = content.replace(/const chunkSentences = sentences\.slice\([^)]+\);\n\s*const isAuth: true/g, "const chunkSentences = sentences.slice(chunkIdx * CHUNK_SIZE, (chunkIdx + 1) * CHUNK_SIZE);\n    const apiKey");
// Wait, replacing 'isAuth: true' back to valid syntax where appropriate
// We know that `apiKey` was used as a string. Now it says `isAuth: true`.
// We can just replace `isAuth: true` with `true` in if statements:
// But wait, the API call body expects `{ sentences: chunk, isAuth: true }` which is valid JSON object syntax.
// So:
content = content.replace(/if \(isAuth: true\)/g, "if (true)");
content = content.replace(/if \(!isAuth: true\)/g, "if (!true)");

fs.writeFileSync("components/AuthPlayer.tsx", content);
