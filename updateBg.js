const fs = require("fs");
let c = fs.readFileSync("components/Player.tsx", "utf8");

c = c.replace(/bg-\[\#fafafa\]/g, 'bg-white');
// And make sure there is no bg-blue remaining
c = c.replace(/bg-blue-/g, 'bg-gray-');

fs.writeFileSync("components/Player.tsx", c);
