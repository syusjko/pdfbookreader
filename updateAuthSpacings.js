const fs = require("fs");
let c = fs.readFileSync("app/auth/login/page.tsx", "utf8");

// Change min-h-screen to h-[100dvh] so it exactly fits the dynamic viewport
c = c.replace('className="min-h-screen flex w-full bg-white font-sans overflow-hidden"', 'className="h-[100dvh] overflow-y-auto flex w-full bg-white font-sans"');

// Reduce spacing for mobile
c = c.replace('className="text-center mb-10"', 'className="text-center mb-6 sm:mb-10"');
c = c.replace(/py-3\.5/g, 'py-2.5 sm:py-3.5');
c = c.replace('className="my-8 relative"', 'className="my-6 sm:my-8 relative"');
c = c.replace('className="w-full max-w-[340px] mx-auto mt-12 md:mt-0"', 'className="w-full max-w-[340px] mx-auto mt-16 md:mt-0"');
// Make the back button slightly smaller padding from top on mobile
c = c.replace('className="absolute top-8 left-8', 'className="absolute top-5 sm:top-8 left-5 sm:left-8');

fs.writeFileSync("app/auth/login/page.tsx", c);
console.log("Auth spacings modified");
