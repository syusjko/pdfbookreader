const fs = require("fs");
let content = fs.readFileSync("components/Player.tsx", "utf8");

content = content.replace(
  "import { Play, Pause, SkipForward, SkipBack, UploadCloud, Key, BookOpen, Loader2, Headphones, Volume2, VolumeX } from 'lucide-react';",
  "import { Play, Pause, SkipForward, SkipBack, UploadCloud, Key, BookOpen, Loader2, Headphones, Volume2, VolumeX, Bookmark } from 'lucide-react';"
);

content = content.replace(
  "export default function Player() {",
  `interface AuthPlayerProps {
  bookId: string;
  title: string;
  signedUrl: string;
  initialIndex: number;
  initialBookmarks: number[];
}

export default function AuthPlayer({ bookId, title, signedUrl, initialIndex, initialBookmarks }: AuthPlayerProps) {`
);

content = content.replace(
  "const [currentIndex, setCurrentIndex] = useState(0);",
  `const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);
  const [bookmarks, setBookmarks] = useState<number[]>(initialBookmarks || []);
  const [hasLoaded, setHasLoaded] = useState(false);`
);

content = content.replace("const [apiKey, setApiKey] = useState('');", "");

// Replace handleFileUpload
const uploadStart = content.indexOf('const handleFileUpload = async');
const playAudioStart = content.indexOf('const fetchChunk = (chunkIdx: number) => {');

if (uploadStart === -1 || playAudioStart === -1) {
  console.log('Error: bounds not found', uploadStart, playAudioStart);
  process.exit(1);
}

const newUploadLogic = `
  const loadPdfFromUrl = async () => {
    if (hasLoaded) return;
    setIsLoading(true);
    setLoadingText('서버에서 책 데이터를 가져오는 중...');
    try {
      const response = await fetch(signedUrl);
      const blob = await response.blob();
      setLoadingText('텍스트 분석 및 챕터 나누는 중...');
      const text = await extractTextFromPdf(blob as File);
      const split = splitIntoSentences(text.slice(findStoryStartIndex(text)));
      
      const sampleText = split.slice(0, 50).join(' ');
      const krCount = (sampleText.match(/[가-힣]/g) || []).length;
      const jpCount = (sampleText.match(/[\\u3040-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff]/g) || []).length;
      const frCount = (sampleText.match(/[éèêëàâîïôùûüçœæ]/gi) || []).length;
      if (krCount > sampleText.length * 0.1) { setBookLang('ko-KR'); setReadingSpeed(1.0); }
      else if (jpCount > sampleText.length * 0.1) { setBookLang('ja-JP'); setReadingSpeed(0.9); }
      else if (frCount > sampleText.length * 0.01) { setBookLang('fr-FR'); setReadingSpeed(0.9); }
      else { setBookLang('en-US'); setReadingSpeed(1.0); }

      const extractedChapters: {index: number, title: string}[] = [];
      const chRegex = /^(PREMIER|DEUXI[EE]ME|TROISI[EE]ME|QUATRI[EE]ME|CINQUI[EE]ME|SIXI[EE]ME|SEPTI[EE]ME|HUITI[EE]ME|NEUVI[EE]ME|DIXI[EE]ME)\\s+CHAPITRE|^(CHAPITRE|CHAPTER)\\s*(?:[IVX]+|\\d+)|^제\\s*\\d+\\s*장/i;
      for (let i = 0; i < split.length; i++) {
        const match = split[i].match(chRegex);
        if (match) extractedChapters.push({ index: i, title: match[0].toUpperCase() });
      }
      setChapters(extractedChapters);
      setSentences(split);
      if (initialIndex >= split.length) setCurrentIndex(0);
      setHasLoaded(true);
      setShowMobilePanel(true);
    } catch (err) {
      console.error(err);
      alert('오류가 발생했습니다: ' + (err.message || String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (signedUrl && !hasLoaded) loadPdfFromUrl(); }, [signedUrl]);

  useEffect(() => {
    if (!hasLoaded || sentences.length === 0) return;
    const timer = setTimeout(() => {
      fetch('/api/books/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: bookId, last_read_index: currentIndex })
      }).catch(console.error);
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentIndex, hasLoaded, bookId, sentences.length]);

  const toggleBookmark = () => {
    const newBookmarks = bookmarks.includes(currentIndex)
      ? bookmarks.filter(b => b !== currentIndex)
      : [...bookmarks, currentIndex];
    setBookmarks(newBookmarks);
    fetch('/api/books/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book_id: bookId, bookmarks: newBookmarks })
    }).catch(console.error);
  };
`;

content = content.substring(0, uploadStart) + newUploadLogic + content.substring(playAudioStart);

// Replace landing page safely
const landingStart = content.indexOf('if (sentences.length === 0) {');
const landingEndString = '        </main>\n      </div>\n    );\n  }';
const landingEnd = content.indexOf(landingEndString, landingStart);

if (landingStart !== -1 && landingEnd !== -1) {
  const replacementLanding = `if (sentences.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="font-bold text-lg text-gray-800">{loadingText || "오디오북을 불러오는 중..."}</p>
      </div>
    );
  }`;
  
  content = content.substring(0, landingStart) + replacementLanding + content.substring(landingEnd + landingEndString.length);
}

// API key exact replacements
content = content.replace(
  "body: JSON.stringify({ sentences: chunkSentences, apiKey })",
  "body: JSON.stringify({ sentences: chunkSentences, isAuth: true })"
);
content = content.replace(
  "if (sentences.length === 0 || !apiKey) return;",
  "if (sentences.length === 0) return;"
);
content = content.replace(
  "if (!apiKey || chunkIdx * CHUNK_SIZE >= sentences.length) return;",
  "if (chunkIdx * CHUNK_SIZE >= sentences.length) return;"
);

// Fix array dependency
content = content.replace(
  "[currentIndex, sentences, apiKey, cacheTrigger]",
  "[currentIndex, sentences, cacheTrigger]"
);

// Bookmark button and title
content = content.replace(
  '<span className="text-xl font-bold tracking-tight text-gray-800 hidden sm:block">BookReader</span>',
  '<span className="text-xl font-bold tracking-tight text-gray-800 hidden sm:block">{title}</span>'
);

content = content.replace(
  /(<button[^>]*onClick=\{toggleTranslate\}[^>]*>)/,
  `<button
            onClick={toggleBookmark}
            className={\`p-2.5 rounded-full transition-colors \${bookmarks.includes(currentIndex) ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}\`}
            title="북마크"
          >
            <Bookmark className="w-4 h-4" fill={bookmarks.includes(currentIndex) ? "currentColor" : "none"} />
          </button>\n          $1`
);

content = content.replace(/window\.location\.reload\(\)/g, "window.location.href = '/dashboard'");

fs.writeFileSync("components/AuthPlayer.tsx", content);
console.log("Super Clean v3 Done");
