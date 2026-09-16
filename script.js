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

content = content.replace(
  "const [apiKey, setApiKey] = useState('');",
  "// apiKey not needed"
);

content = content.replace(/apiKey/g, "isAuth: true");

const uploadStart = content.indexOf('const handleFileUpload = async');
const uploadEnd = content.indexOf('const playAudio = async');
const newUpload = `
  const loadPdfFromUrl = async () => {
    if (hasLoaded) return;
    setIsLoading(true);
    setLoadingText('서버에서 오디오북을 가져오는 중...');
    
    try {
      const response = await fetch(signedUrl);
      const arrayBuffer = await response.arrayBuffer();
      
      setLoadingText('텍스트 분석 및 챕터 나누는 중...');
      const extractedText = await extractTextFromPdf(arrayBuffer);
      const parsedSentences = splitIntoSentences(extractedText);
      setSentences(parsedSentences);
      
      if (initialIndex >= parsedSentences.length) {
        setCurrentIndex(0);
      }
      setHasLoaded(true);
    } catch (err) {
      alert('PDF를 불러오는 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPdfFromUrl();
  }, [signedUrl]);

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
content = content.substring(0, uploadStart) + newUpload + content.substring(uploadEnd);

const landingRegex = /if \(sentences\.length === 0\) \{[\s\S]*?return \([\s\S]*?<\/div>\s*\);\s*\}/;
content = content.replace(landingRegex, `if (sentences.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="font-bold text-lg text-gray-800">{loadingText}</p>
      </div>
    );
  }`);

content = content.replace(
  /<span className="text-xl font-bold tracking-tight text-gray-800 hidden sm:block">BookReader<\/span>/,
  `<span className="text-xl font-bold tracking-tight text-gray-800 hidden sm:block">{title}</span>`
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
console.log("Done!");
