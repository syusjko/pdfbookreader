const fs = require("fs");
let c = fs.readFileSync("components/Player.tsx", "utf8");

c = c.replace(/text-blue-600/g, 'text-black');

fs.writeFileSync("components/Player.tsx", c);
console.log("Spinner modified");
