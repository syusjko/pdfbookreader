const fs = require("fs");
let c = fs.readFileSync("components/Player.tsx", "utf8");

// Landing page main container padding
c = c.replace('className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"', 'className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-12 flex flex-col justify-center"');

// Hero Banner margin
c = c.replace('className="relative w-full bg-black rounded-3xl overflow-hidden shadow-xl mb-12 sm:mb-16"', 'className="relative w-full bg-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl mb-6 sm:mb-16"');

// Hero Banner padding
c = c.replace('className="relative z-10 flex flex-col md:flex-row items-center justify-between px-8 py-12 md:p-16 gap-8"', 'className="relative z-10 flex flex-col md:flex-row items-center justify-between px-6 py-8 md:p-16 gap-6 sm:gap-8"');

// Upload Card height
c = c.replace('className="flex flex-col items-center justify-center w-full h-48 border-2', 'className="flex flex-col items-center justify-center w-full h-36 sm:h-48 border-2');

// Text sizing and margin in Hero
c = c.replace('className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-4 break-keep"', 'className="text-2xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-3 sm:mb-4 break-keep"');
c = c.replace('className="text-gray-300 text-base sm:text-lg mb-8 leading-relaxed font-medium break-keep"', 'className="text-gray-300 text-sm sm:text-lg mb-6 sm:mb-8 leading-relaxed font-medium break-keep"');

// API Section margin/padding
c = c.replace('className="max-w-2xl mx-auto bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-100"', 'className="max-w-2xl mx-auto w-full bg-gray-50 rounded-2xl p-4 sm:p-8 border border-gray-100 mt-auto sm:mt-0"');

fs.writeFileSync("components/Player.tsx", c);
console.log("Player.tsx spacings modified for mobile");
