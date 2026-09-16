const fs = require("fs");
let c = fs.readFileSync("components/AuthPlayer.tsx", "utf8");

c = c.replace(
  /<span className="text-xl font-bold tracking-tight text-gray-800 hidden sm:block">BookReader<\/span>/,
  `<span className="text-xl font-bold tracking-tight text-gray-800 hidden sm:block">{title}</span>`
);

c = c.replace(
  /(<button[^>]*onClick=\{toggleTranslate\}[^>]*>)/,
  `<button
            onClick={toggleBookmark}
            className={\`p-2.5 rounded-full transition-colors \${bookmarks.includes(currentIndex) ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}\`}
            title="북마크"
          >
            <Bookmark className="w-4 h-4" fill={bookmarks.includes(currentIndex) ? "currentColor" : "none"} />
          </button>\n          $1`
);

c = c.replace(/window\.location\.reload\(\)/g, "window.location.href = '/dashboard'");

fs.writeFileSync("components/AuthPlayer.tsx", c);
