const fs = require("fs");
let c = fs.readFileSync("app/auth/login/page.tsx", "utf8");

// Image grayscale
c = c.replace(
  'className="absolute inset-0 w-full h-full object-cover"',
  'className="absolute inset-0 w-full h-full object-cover grayscale mix-blend-luminosity opacity-90"'
);

// Fonts
c = c.replace('className="text-2xl font-extrabold text-gray-900 tracking-tight leading-snug"', 'className="text-2xl font-serif font-extrabold text-black tracking-tight leading-snug"');

// Inputs
c = c.replace(/rounded-xl/g, 'rounded-sm');
c = c.replace(/focus:border-blue-500/g, 'focus:border-black');
c = c.replace(/focus:ring-blue-500/g, 'focus:ring-black');

// Primary Button (was yellow)
c = c.replace(/bg-\[\#fde047\] hover:bg-\[\#facc15\] text-gray-900/g, 'bg-black hover:bg-gray-800 text-white');

// Outline Button
c = c.replace(/border-gray-200 text-gray-600/g, 'border-gray-300 text-black');

// Google button
c = c.replace(/border border-gray-200 text-gray-700/g, 'border border-gray-300 text-black');

fs.writeFileSync("app/auth/login/page.tsx", c);
console.log("Auth page modified");
