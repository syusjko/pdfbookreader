const fs = require("fs");
let c = fs.readFileSync("components/AuthPlayer.tsx", "utf8");

c = c.replace(
  "body: JSON.stringify({ sentences: chunkSentences, isAuth: true, targetLang })",
  "body: JSON.stringify({ sentences: chunkSentences, isAuth: true, targetLang, bookId, chunkIndex: chunkIdx })"
);

fs.writeFileSync("components/AuthPlayer.tsx", c);
console.log("AuthPlayer.tsx modified to send bookId and chunkIndex");
