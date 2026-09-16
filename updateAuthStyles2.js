const fs = require("fs");
let c = fs.readFileSync("app/auth/login/page.tsx", "utf8");

c = c.replace(/bg-gray-100/g, 'bg-white border-r border-gray-200');

fs.writeFileSync("app/auth/login/page.tsx", c);
console.log("Auth page bg modified");
