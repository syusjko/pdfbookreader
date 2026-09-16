const fs = require("fs");
let content = fs.readFileSync("components/Player.tsx", "utf8");

content = content.replace(
  `export default function Player() {`,
  `import { Bookmark } from "lucide-react";

interface AuthPlayerProps {
  bookId: string;
  title: string;
  signedUrl: string;
  initialIndex: number;
  initialBookmarks: number[];
}

export default function AuthPlayer({ bookId, title, signedUrl, initialIndex, initialBookmarks }: AuthPlayerProps) {`
);

content = content.replace(
  `const [apiKey, setApiKey] = useState('')`,
  `const [bookmarks, setBookmarks] = useState<number[]>(initialBookmarks || [])
  const [hasLoaded, setHasLoaded] = useState(false)`
);

content = content.replace(
  `const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)`,
  `const [currentSentenceIndex, setCurrentSentenceIndex] = useState(initialIndex || 0)`
);

// We need to replace the `handleFileUpload` function with `loadPdfFromUrl` and the useEffect.
// Since handleFileUpload is large, we can find its start and end.
const startUpload = content.indexOf('const handleFileUpload');
const endUpload = content.indexOf('const playAudio = async (index: number) =>');

const newUploadLogic = `
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
        setCurrentSentenceIndex(0);
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

  // Save Progress Debounced
  useEffect(() => {
    if (!hasLoaded || sentences.length === 0) return;
    const timer = setTimeout(() => {
      fetch('/api/books/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: bookId, last_read_index: currentSentenceIndex })
      }).catch(console.error);
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentSentenceIndex, hasLoaded, bookId, sentences.length]);

  const toggleBookmark = () => {
    const newBookmarks = bookmarks.includes(currentSentenceIndex)
      ? bookmarks.filter(b => b !== currentSentenceIndex)
      : [...bookmarks, currentSentenceIndex];
    setBookmarks(newBookmarks);
    
    fetch('/api/books/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book_id: bookId, bookmarks: newBookmarks })
    }).catch(console.error);
  };

  `;

content = content.substring(0, startUpload) + newUploadLogic + content.substring(endUpload);

// Fix API calls
content = content.replace(/apiKey\s*(,?)/g, (match, p1) => `isAuth: true${p1}`);
// Wait, the above might replace apiKey in state declaration if not careful, but we already replaced it.
// Actually, let's just do targeted replace for the fetch bodies:
content = content.replace(/body: JSON\.stringify\(\{ sentences: chunk, apiKey \}\)/g, `body: JSON.stringify({ sentences: chunk, isAuth: true })`);
content = content.replace(/body: JSON\.stringify\(\{ sentences: \[sentences\[currentIndex\]\], apiKey \}\)/g, `body: JSON.stringify({ sentences: [sentences[currentIndex]], isAuth: true })`);

// Remove landing page
const startLanding = content.indexOf('if (sentences.length === 0) {');
const endLanding = content.lastIndexOf('return ('); 
// This is tricky. Let's just use regex for the landing page return block
content = content.replace(/if \(sentences\.length === 0\) \{[\s\S]*?return \([\s\S]*?\}\)/, 
`if (sentences.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="font-bold text-lg text-gray-800">{loadingText}</p>
      </div>
    );
  }`);

// Add Bookmark button
content = content.replace(/<span className="font-semibold text-gray-800 truncate max-w-\[120px\] sm:max-w-\[200px\]">[^<]+<\/span>/, 
`<span className="font-semibold text-gray-800 truncate max-w-[120px] sm:max-w-[200px]">{title}</span>`);

content = content.replace(/(<button[\s\S]*?onClick=\{toggleTranslate\}[\s\S]*?<\/button>)/, 
`$1
          <button
            onClick={toggleBookmark}
            className={\`p-2.5 rounded-full transition-colors \${bookmarks.includes(currentSentenceIndex) ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}\`}
            title="북마크"
          >
            <Bookmark className="w-4 h-4" fill={bookmarks.includes(currentSentenceIndex) ? "currentColor" : "none"} />
          </button>`);

// Fix router.push to go back to dashboard
content = content.replace(/onClick=\{\(\) => window\.location\.reload\(\)\}/g, `onClick={() => window.location.href = '/dashboard'}`);


fs.writeFileSync("components/AuthPlayer.tsx", content);
