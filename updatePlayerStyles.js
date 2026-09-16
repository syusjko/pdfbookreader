const fs = require("fs");
let c = fs.readFileSync("components/Player.tsx", "utf8");

// Navbar replacements
c = c.replace(/bg-blue-600/g, 'bg-black');
c = c.replace(/border-blue-600/g, 'border-black');

// Hero Banner replacements
c = c.replace(/bg-gradient-to-r from-blue-700 to-indigo-800/g, 'bg-black');
c = c.replace(/text-blue-100/g, 'text-gray-300');

// Pinging green dot block
const oldPingDot = `<div className="hidden md:flex items-center gap-2 text-sm text-blue-200 bg-black/20 w-fit px-4 py-2 rounded-full backdrop-blur-sm">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  하루 3권 무료 분석 제공
                </div>`;
const newPingDot = `<div className="hidden md:flex items-center gap-2 text-sm text-gray-300 border border-gray-800 bg-white/5 w-fit px-4 py-2 rounded-full backdrop-blur-sm">
                  하루 3권 무료 분석 제공
                </div>`;
c = c.replace(oldPingDot, newPingDot);

// Upload Card replacements
c = c.replace(/border-blue-200/g, 'border-gray-300');
c = c.replace(/hover:border-blue-500/g, 'hover:border-black');
c = c.replace(/bg-blue-50\/50/g, 'bg-gray-50/50');
c = c.replace(/hover:bg-blue-50/g, 'hover:bg-gray-50');
c = c.replace(/bg-blue-100/g, 'bg-gray-200');
c = c.replace(/text-blue-500/g, 'text-black');
c = c.replace(/text-blue-700/g, 'text-black');

// Input focus replacements
c = c.replace(/focus-within:border-blue-500/g, 'focus-within:border-black');
c = c.replace(/focus-within:ring-blue-500/g, 'focus-within:ring-black');

// Feature icons removal
c = c.replace(/\{\/\* ── Feature Icons \(Millie's Library Style\) ── \*\/\}[\s\S]*?<\/section>/, '');

fs.writeFileSync("components/Player.tsx", c);
console.log("Player.tsx styles modified");
