const fs = require("fs");
let c = fs.readFileSync("components/AuthPlayer.tsx", "utf8");

// 1. Add targetLang state
c = c.replace(
  "const [bookLang, setBookLang] = useState('en-US');",
  "const [bookLang, setBookLang] = useState('en-US');\n  const [targetLang, setTargetLang] = useState('Korean');"
);

// 2. Add targetLang to fetch('/api/analyze')
c = c.replace(
  "body: JSON.stringify({ sentences: chunkSentences, isAuth: true })",
  "body: JSON.stringify({ sentences: chunkSentences, isAuth: true, targetLang })"
);

// Add targetLang to useEffect dependency array for fetchChunk
// Actually fetchChunk is defined inside the component and called in useEffect
c = c.replace(
  "[currentIndex, sentences, cacheTrigger]",
  "[currentIndex, sentences, cacheTrigger, targetLang]"
);

// Wait, if targetLang changes, we need to clear analysis cache!
// We can do that in the onChange of the new select.

// 3. Add Back to Dashboard Button and Bookmark Button at the top left/right
// Find the floating menu block
const noiseMenuStart = c.indexOf('{/* Floating White Noise Menu */}');
const floatingButtons = `
      {/* Top Left: Back to Dashboard */}
      <button 
        onClick={() => window.location.href = '/dashboard'}
        className="absolute top-4 left-4 z-50 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-gray-200 text-xs font-bold font-mono tracking-widest text-black hover:bg-gray-100 transition-all flex items-center gap-2"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        DASHBOARD
      </button>

      {/* Top Right Buttons */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
        <button 
          onClick={toggleBookmark}
          className={\`w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full shadow-sm border \${bookmarks.includes(currentIndex) ? 'border-yellow-400 text-yellow-500' : 'border-gray-200 text-gray-500'} hover:text-black hover:scale-105 transition-all\`}
          title="북마크"
        >
          <Bookmark className="w-4 h-4" fill={bookmarks.includes(currentIndex) ? "currentColor" : "none"} />
        </button>
`;

c = c.replace('{/* Floating White Noise Menu */}', floatingButtons + '\n      {/* Floating White Noise Menu */}');
// But wait, the original noise menu is wrapped in `<div className="absolute top-4 right-4 z-50">`
c = c.replace('<div className="absolute top-4 right-4 z-50">\n        <div className="relative">', '<div>\n        <div className="relative">');


// 4. Update the bottom controls to have Audio Lang and Translation Lang
const selectHTML = `<select 
            value={bookLang} 
            onChange={(e) => {
               const newLang = e.target.value;
               setBookLang(newLang);
               setReadingSpeed(newLang.startsWith('en') ? 1.0 : 0.9);
               // Clear audio cache to force re-fetch with new language
               Object.values(audioCache.current).forEach(p => {
                 p.then(url => { if (url) URL.revokeObjectURL(url); }).catch(() => {});
               });
               audioCache.current = {};
               activeFetches.current.clear();
            }}
            className="text-[10px] font-mono font-bold text-gray-400 hover:text-black transition-colors bg-transparent outline-none cursor-pointer text-center appearance-none"
          >
            <option value="en-US">EN</option>
            <option value="fr-FR">FR</option>
            <option value="ko-KR">KO</option>
            <option value="ja-JP">JA</option>
          </select>`;

const newSelects = `<div className="flex flex-col items-center gap-1 relative group">
            <span className="text-[7px] text-gray-300 font-mono tracking-widest absolute -top-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">AUDIO</span>
            <select 
              value={bookLang} 
              onChange={(e) => {
                 const newLang = e.target.value;
                 setBookLang(newLang);
                 setReadingSpeed(newLang.startsWith('en') ? 1.0 : 0.9);
                 Object.values(audioCache.current).forEach(p => {
                   p.then(url => { if (url) URL.revokeObjectURL(url); }).catch(() => {});
                 });
                 audioCache.current = {};
                 activeFetches.current.clear();
              }}
              className="text-[10px] font-mono font-bold text-gray-400 hover:text-black transition-colors bg-transparent outline-none cursor-pointer text-center appearance-none"
            >
              <option value="en-US">EN</option>
              <option value="fr-FR">FR</option>
              <option value="ko-KR">KO</option>
              <option value="ja-JP">JA</option>
            </select>
          </div>
          
          <div className="w-[1px] h-3 bg-gray-200" />
          
          <div className="flex flex-col items-center gap-1 relative group">
            <span className="text-[7px] text-gray-300 font-mono tracking-widest absolute -top-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">TRANS</span>
            <select 
              value={targetLang} 
              onChange={(e) => {
                 setTargetLang(e.target.value);
                 analysisCache.current = {}; // Clear analysis cache so it fetches new translation
                 setCacheTrigger(prev => prev + 1); // Trigger fetch
              }}
              className="text-[10px] font-mono font-bold text-gray-400 hover:text-black transition-colors bg-transparent outline-none cursor-pointer text-center appearance-none"
            >
              <option value="Korean">KO</option>
              <option value="English">EN</option>
              <option value="Japanese">JA</option>
              <option value="French">FR</option>
            </select>
          </div>`;

c = c.replace(selectHTML, newSelects);

fs.writeFileSync("components/AuthPlayer.tsx", c);
console.log("Updated!");
