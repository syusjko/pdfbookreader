const fs = require("fs");
let c = fs.readFileSync("components/AuthPlayer.tsx", "utf8");

c = c.replace(/if \(!apiKey \|\| chunkIdx \* CHUNK_SIZE >= sentences.length\) return;/g, 
              "if (chunkIdx * CHUNK_SIZE >= sentences.length) return;");
c = c.replace(/body: JSON\.stringify\(\{ sentences: chunkSentences, apiKey \}\)/g, 
              "body: JSON.stringify({ sentences: chunkSentences, isAuth: true })");
c = c.replace(/if \(sentences\.length === 0 \|\| !apiKey\) return;/g, 
              "if (sentences.length === 0) return;");
c = c.replace(/\[currentIndex, sentences, apiKey, cacheTrigger\]/g, 
              "[currentIndex, sentences, cacheTrigger]");

fs.writeFileSync("components/AuthPlayer.tsx", c);
