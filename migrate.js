const fs = require('fs');
let code = fs.readFileSync('components/Player.tsx', 'utf8');

// 1. Remove audio cache and active fetches
code = code.replace(/const audioCache = useRef<Record.*?;\n/g, '');
code = code.replace(/const activeFetches = useRef<Set.*?;\n/g, '');
code = code.replace(/const fetchAudioForIndex = async [\s\S]*?};\n/s, '');

// 2. Add availableVoices state
code = code.replace('const [cacheTrigger, setCacheTrigger] = useState(0);', 'const [cacheTrigger, setCacheTrigger] = useState(0);\n  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);\n  useEffect(() => {\n    const loadVoices = () => setAvailableVoices(window.speechSynthesis.getVoices());\n    loadVoices();\n    if (window.speechSynthesis.onvoiceschanged !== undefined) {\n      window.speechSynthesis.onvoiceschanged = loadVoices;\n    }\n  }, []);');

// 3. Replace the useEffect for playing audio
const oldPlayEffect = /useEffect\(\(\) => \{\n    const audio = audioRef\.current;[\s\S]*?\}, \[currentIndex, isPlaying, sentences\]\);/s;
const newPlayEffect = `useEffect(() => {
    if (!isPlaying) {
      window.speechSynthesis.cancel();
      return;
    }
    if (currentIndex >= sentences.length) {
      setIsPlaying(false);
      return;
    }
    const text = sentences[currentIndex];
    if (!text || !text.trim()) {
      setCurrentIndex(prev => prev + 1);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = bookLang;
    utterance.rate = readingSpeed;
    const langVoices = availableVoices.filter(v => v.lang.startsWith(bookLang.split('-')[0]));
    if (langVoices.length > 0) {
      const natural = langVoices.find(v => v.name.includes("Natural"));
      const premium = langVoices.find(v => v.name.includes("Premium") || v.name.includes("Enhanced"));
      const google = langVoices.find(v => v.name.includes("Google"));
      utterance.voice = natural || premium || google || langVoices[0];
    }
    utterance.onend = () => {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 400);
    };
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        console.error("Speech error:", e);
        setIsPlaying(false);
      }
    };
    setIsAudioLoading(false);
    window.speechSynthesis.speak(utterance);
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [currentIndex, isPlaying, sentences, readingSpeed, bookLang, availableVoices]);`;
  
code = code.replace(oldPlayEffect, newPlayEffect);

// 4. Remove audio prefetching from useEffect
code = code.replace(/if \(idx <= currentIndex \+ 7 && idx >= currentIndex\) {[\s\S]*?catch \(\) \{\}\n            }/s, '');

// 5. Remove audio caching clear on lang change
code = code.replace(/\/\/ Clear audio cache to force re-fetch[\s\S]*?activeFetches\.current\.clear\(\);/s, '');

// 6. Remove <audio> tag
code = code.replace(/<audio\n\s*ref=\{audioRef\}[\s\S]*?\/>/g, '');

fs.writeFileSync('components/Player.tsx', code);
console.log('Migrated to Web Speech API successfully.');
