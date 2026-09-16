const fs = require("fs");
let c = fs.readFileSync("components/AuthPlayer.tsx", "utf8");

// 1. Remove showMobilePanel and add showSyntaxPanel
c = c.replace(
  "const [showMobilePanel, setShowMobilePanel] = useState(false);",
  "const [showSyntaxPanel, setShowSyntaxPanel] = useState(false);"
);

// 2. Remove setShowMobilePanel(true) from loadPdfFromUrl
c = c.replace("setShowMobilePanel(true);\n", "");

// 3. Change desktop syntax panel wrapper to conditionally render based on showSyntaxPanel
c = c.replace(
  '<div className="hidden md:flex w-96 bg-white border-l border-gray-200 flex-col z-10">',
  '{showSyntaxPanel && (<div className="hidden md:flex w-96 bg-white border-l border-gray-200 flex-col z-10">'
);

// 4. Change desktop syntax panel closing div
c = c.replace(
  '            </div>\n          </div>\n        </div>\n      </div>',
  '            </div>\n          </div>\n        )}</div>\n      </div>'
);

// 5. Replace references to showMobilePanel
c = c.replace(/showMobilePanel/g, "showSyntaxPanel");
c = c.replace(/setShowMobilePanel/g, "setShowSyntaxPanel");

// 6. Add Syntax toggle button to the top right header (next to bookmark)
const bookmarkBtn = `<button \n          onClick={toggleBookmark}`;
const syntaxBtn = `<button 
          onClick={() => setShowSyntaxPanel(!showSyntaxPanel)}
          className={\`hidden md:flex w-10 h-10 items-center justify-center bg-white/80 backdrop-blur-md rounded-full shadow-sm border \${showSyntaxPanel ? 'border-black text-black' : 'border-gray-200 text-gray-500'} hover:text-black hover:scale-105 transition-all\`}
          title="구문 분석 창 열기/닫기"
        >
          <BookOpen className="w-4 h-4" />
        </button>
        <button \n          onClick={toggleBookmark}`;
c = c.replace(bookmarkBtn, syntaxBtn);

fs.writeFileSync("components/AuthPlayer.tsx", c);
console.log("Syntax Panel updated");
