const fs = require("fs");
let c = fs.readFileSync("app/dashboard/page.tsx", "utf8");

c = c.replace(/text-\[13px\] font-semibold/g, 'text-sm font-serif font-bold tracking-tight');
c = c.replace(/rounded-xl/g, 'rounded-sm');
c = c.replace(/rounded-2xl/g, 'rounded-sm');
c = c.replace(/shadow-\[0_1px_3px_rgba\(0,0,0,0\.08\)\]/g, 'border border-gray-200 shadow-none');

fs.writeFileSync("app/dashboard/page.tsx", c);
console.log("Fonts modified");
