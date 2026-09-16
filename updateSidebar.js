const fs = require("fs");
let c = fs.readFileSync("app/dashboard/Sidebar.tsx", "utf8");

// Monochromatic avatars
c = c.replace(/bg-gradient-to-br from-amber-400 to-orange-500/g, 'bg-black text-white border border-gray-800');
c = c.replace(/bg-\[\#333\]/g, 'bg-black');
c = c.replace(/rounded-xl/g, 'rounded-sm');
c = c.replace(/rounded-lg/g, 'rounded-sm');
c = c.replace(/bg-gray-900/g, 'bg-black');
c = c.replace(/text-red-500/g, 'text-black font-bold');
c = c.replace(/hover:bg-red-50/g, 'hover:bg-gray-100');

fs.writeFileSync("app/dashboard/Sidebar.tsx", c);
console.log("Sidebar modified");
