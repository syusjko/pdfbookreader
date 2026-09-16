const fs = require("fs");
let c = fs.readFileSync("app/dashboard/page.tsx", "utf8");

// Remove the Quick Actions section completely
const startQuickActions = c.indexOf('{/*  Quick Actions (Millie Feature Icons Style)  */}');
if (startQuickActions === -1) {
  // Try normal string
  const startQA2 = c.indexOf('{/*');
  // I will just use regex to remove the section
}

c = c.replace(/\{\/\* .*Quick Actions.*\n\s*<section className="mb-12">[\s\S]*?<\/section>/, '');

// Colors styling in dashboard
c = c.replace(/hover:text-blue-600/g, 'hover:text-black underline-offset-2 hover:underline');
c = c.replace(/bg-gradient-to-br from-slate-100 via-white to-blue-50/g, 'bg-[#f7f7f7] border border-gray-200');

fs.writeFileSync("app/dashboard/page.tsx", c);
console.log("Dashboard modified");
