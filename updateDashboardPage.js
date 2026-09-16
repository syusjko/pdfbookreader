const fs = require("fs");
let c = fs.readFileSync("app/dashboard/page.tsx", "utf8");

// Import BookList
c = c.replace(
  "import UploadButton from './UploadButton'",
  "import UploadButton from './UploadButton'\nimport BookList from './BookList'"
);

// Replace books grid mapping with BookList
const oldGridRegex = /<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\)\s*}/;
const newGrid = `<BookList books={books} />\n          </div>\n        </div>\n      </div>\n    </div>\n  )\n}`;

c = c.replace(oldGridRegex, newGrid);

fs.writeFileSync("app/dashboard/page.tsx", c);
console.log("Dashboard page updated to use BookList");
