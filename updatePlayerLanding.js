const fs = require("fs");
let c = fs.readFileSync("components/Player.tsx", "utf8");

c = c.replace(
  '<div className="min-h-[100dvh] bg-white flex flex-col font-sans text-gray-900 overflow-x-hidden">',
  '<div className="h-[100dvh] overflow-y-auto bg-white flex flex-col font-sans text-gray-900 overflow-x-hidden">'
);

fs.writeFileSync("components/Player.tsx", c);
console.log("Player.tsx landing modified");
