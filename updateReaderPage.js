const fs = require("fs");
let c = fs.readFileSync("app/reader/[id]/page.tsx", "utf8");

c = c.replace(/h-screen/g, 'h-[100dvh]');

fs.writeFileSync("app/reader/[id]/page.tsx", c);
console.log("Reader page modified");
