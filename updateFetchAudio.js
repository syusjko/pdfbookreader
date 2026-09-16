const fs = require("fs");
let c = fs.readFileSync("components/AuthPlayer.tsx", "utf8");

const oldCode = `  const fetchAudioForIndex = (index: number): Promise<string | null> => {
    if (index >= sentences.length) return Promise.resolve(null);
    if (index in audioCache.current) return audioCache.current[index];
    if (activeFetches.current.has(index)) return Promise.resolve(null);

    activeFetches.current.add(index);
    setPrefetchStatus('Buffering AI Voice...');
    const text = sentences[index];
    
    const apiUrl = \`/api/tts?text=\${encodeURIComponent(text)}&lang=\${encodeURIComponent(bookLang)}&speed=\${encodeURIComponent(readingSpeed)}\`;

    const promise = fetch(apiUrl)
      .then(res => {
        if (!res.ok) throw new Error(\`Status \${res.status}\`);
        return res.blob();
      })
      .then(blob => {
        activeFetches.current.delete(index);
        if (activeFetches.current.size === 0) setPrefetchStatus('');
        return URL.createObjectURL(blob);
      })
      .catch(err => {
        console.error(\`Prefetch error for index \${index}:\`, err);
        activeFetches.current.delete(index);
        delete audioCache.current[index]; 
        if (activeFetches.current.size === 0) setPrefetchStatus('');
        return null;
      });

    audioCache.current[index] = promise;
    return promise;
  };`;

const newCode = `  const fetchAudioForIndex = async (index: number): Promise<string | null> => {
    if (index >= sentences.length) return null;
    if (index in audioCache.current) return await audioCache.current[index];
    if (activeFetches.current.has(index)) return null;

    activeFetches.current.add(index);
    setPrefetchStatus('Buffering AI Voice...');
    
    let textToRead = sentences[index];

    // If AUDIO language is not the original book language, we must read the translation!
    if (bookLang !== originalLang) {
      const chunkIdx = Math.floor(index / CHUNK_SIZE);
      
      if (!analysisCache.current[chunkIdx]) {
        fetchChunk(chunkIdx);
      }
      
      if (analysisCache.current[chunkIdx] instanceof Promise) {
        await analysisCache.current[chunkIdx];
      }
      
      const chunkData = analysisCache.current[chunkIdx];
      if (Array.isArray(chunkData)) {
        const sentenceOffset = index % CHUNK_SIZE;
        if (chunkData[sentenceOffset] && chunkData[sentenceOffset].translation) {
          textToRead = chunkData[sentenceOffset].translation;
        }
      }
    }

    const apiUrl = \`/api/tts?text=\${encodeURIComponent(textToRead)}&lang=\${encodeURIComponent(bookLang)}&speed=\${encodeURIComponent(readingSpeed)}\`;

    const promise = fetch(apiUrl)
      .then(res => {
        if (!res.ok) throw new Error(\`Status \${res.status}\`);
        return res.blob();
      })
      .then(blob => {
        activeFetches.current.delete(index);
        if (activeFetches.current.size === 0) setPrefetchStatus('');
        return URL.createObjectURL(blob);
      })
      .catch(err => {
        console.error(\`Prefetch error for index \${index}:\`, err);
        activeFetches.current.delete(index);
        delete audioCache.current[index]; 
        if (activeFetches.current.size === 0) setPrefetchStatus('');
        return null;
      });

    audioCache.current[index] = promise;
    return promise;
  };`;

c = c.replace(oldCode, newCode);
fs.writeFileSync("components/AuthPlayer.tsx", c);
console.log("Updated fetchAudioForIndex");
