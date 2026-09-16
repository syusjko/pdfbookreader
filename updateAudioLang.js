const fs = require("fs");
let c = fs.readFileSync("components/AuthPlayer.tsx", "utf8");

// 1. Add state
c = c.replace(
  "const [bookLang, setBookLang] = useState('en-US');",
  "const [bookLang, setBookLang] = useState('en-US');\n  const [originalLang, setOriginalLang] = useState('en-US');"
);

// 2. Update loadPdfFromUrl
const oldDetection = `      if (krCount > sampleText.length * 0.1) { setBookLang('ko-KR'); setReadingSpeed(1.0); }
      else if (jpCount > sampleText.length * 0.1) { setBookLang('ja-JP'); setReadingSpeed(0.9); }
      else if (frCount > sampleText.length * 0.01) { setBookLang('fr-FR'); setReadingSpeed(0.9); }
      else { setBookLang('en-US'); setReadingSpeed(1.0); }`;

const newDetection = `      let detected = 'en-US';
      if (krCount > sampleText.length * 0.1) { detected = 'ko-KR'; setReadingSpeed(1.0); }
      else if (jpCount > sampleText.length * 0.1) { detected = 'ja-JP'; setReadingSpeed(0.9); }
      else if (frCount > sampleText.length * 0.01) { detected = 'fr-FR'; setReadingSpeed(0.9); }
      else { detected = 'en-US'; setReadingSpeed(1.0); }
      setBookLang(detected);
      setOriginalLang(detected);`;

c = c.replace(oldDetection, newDetection);

// 3. Helper mappings for rendering options
// Add it above the component or right inside render. We'll add it right before the `<select>` for AUDIO
const oldSelect = `            <select 
              value={bookLang} 
              onChange={(e) => {`;

const codeMapStr = `            {(() => {
              const langToCode: Record<string, string> = { 'Korean': 'ko-KR', 'English': 'en-US', 'Japanese': 'ja-JP', 'French': 'fr-FR' };
              const codeToLabel: Record<string, string> = { 'ko-KR': 'KO', 'en-US': 'EN', 'ja-JP': 'JA', 'fr-FR': 'FR' };
              const targetCode = langToCode[targetLang] || 'ko-KR';
              const availableOptions = Array.from(new Set([originalLang, targetCode]));
              return (
                <select 
                  value={bookLang} 
                  onChange={(e) => {`;

c = c.replace(oldSelect, codeMapStr);

// Close the IIFE for select
const oldSelectEnd = `              <option value="en-US">EN</option>
              <option value="fr-FR">FR</option>
              <option value="ko-KR">KO</option>
              <option value="ja-JP">JA</option>
            </select>`;

const newSelectEnd = `              {availableOptions.map(code => (
                <option key={code} value={code}>{codeToLabel[code]}</option>
              ))}
            </select>
            );
            })()}`;

c = c.replace(oldSelectEnd, newSelectEnd);

fs.writeFileSync("components/AuthPlayer.tsx", c);
console.log("Audio select modified");
