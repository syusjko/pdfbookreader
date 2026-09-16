const fs = require("fs");
let c = fs.readFileSync("app/dashboard/layout.tsx", "utf8");

c = c.replace(/bg-\[\#fafafa\]/g, 'bg-white');

fs.writeFileSync("app/dashboard/layout.tsx", c);
console.log("Layout modified");
