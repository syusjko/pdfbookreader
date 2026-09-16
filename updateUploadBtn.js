const fs = require("fs");
let c = fs.readFileSync("app/dashboard/UploadButton.tsx", "utf8");

c = c.replace(/bg-gray-900/g, 'bg-black');
c = c.replace(/rounded-xl/g, 'rounded-sm border border-black');

fs.writeFileSync("app/dashboard/UploadButton.tsx", c);
console.log("UploadButton modified");
