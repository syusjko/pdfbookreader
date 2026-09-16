const fs = require('fs');
let code = fs.readFileSync('components/AuthPlayer.tsx', 'utf8');

code = code.replace(/export default function Player\(\) \{/, 
`import { Bookmark } from 'lucide-react'

interface AuthPlayerProps {
  bookId: string;
  title: string;
  signedUrl: string;
  initialIndex: number;
  initialBookmarks: number[];
}

export default function AuthPlayer({ bookId, title, signedUrl, initialIndex, initialBookmarks }: AuthPlayerProps) {`);

code = code.replace(/const \[apiKey, setApiKey\] = useState\(''\)/, 
`  const [bookmarks, setBookmarks] = useState<number[]>(initialBookmarks || [])
  const [hasLoaded, setHasLoaded] = useState(false)`);

code = code.replace(/const \[currentSentenceIndex, setCurrentSentenceIndex\] = useState\(0\)/, 
`  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(initialIndex || 0)`);

code = code.replace(/const handleFileUpload = async \(e: React\.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?(?=\s+const playAudio)/, 
`const loadPdfFromUrl = async () => {
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
    if (!hasLoaded) return;
    const timer = setTimeout(() => {
      fetch('/api/books/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: bookId, last_read_index: currentSentenceIndex })
      }).catch(console.error);
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentSentenceIndex, hasLoaded, bookId]);

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
`);

code = code.replace(/body: JSON\.stringify\(\{ text, targetLanguage: 'ko', apiKey \}\)/g, 
`body: JSON.stringify({ text, targetLanguage: 'ko', isAuth: true })`);

code = code.replace(/if \(sentences\.length === 0\) \{[\s\S]*?return \([\s\S]*?\}\)/, 
`if (sentences.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="font-bold text-lg text-gray-800">{loadingText}</p>
      </div>
    );
  }`);

code = code.replace(/<span className="font-semibold text-gray-800 truncate max-w-\[120px\] sm:max-w-\[200px\]">.+?<\/span>/, 
`<span className="font-semibold text-gray-800 truncate max-w-[120px] sm:max-w-[200px]">{title}</span>`);

code = code.replace(/(<button[\s\S]*?onClick=\{toggleTranslate\}[\s\S]*?<\/button>)/, 
`$1
          <button
            onClick={toggleBookmark}
            className={\`p-2.5 rounded-full transition-colors \${bookmarks.includes(currentSentenceIndex) ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}\`}
            title="북마크"
          >
            <Bookmark className="w-4 h-4" fill={bookmarks.includes(currentSentenceIndex) ? "currentColor" : "none"} />
          </button>`);

fs.writeFileSync('components/AuthPlayer.tsx', code);
console.log("Updated AuthPlayer.tsx");
