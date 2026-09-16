const fs = require("fs");
let code = fs.readFileSync("components/AuthPlayer.tsx", "utf8");
code = code.replace(/}\s*}$/, "}\n");
fs.writeFileSync("components/AuthPlayer.tsx", code);
