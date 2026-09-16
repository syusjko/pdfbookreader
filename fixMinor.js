const fs = require("fs");
let c = fs.readFileSync("components/AuthPlayer.tsx", "utf8");

c = c.replace(/\{\!apiKey \? \(/g, "{!true ? (");
c = c.replace(/} catch \(err\) {/g, "} catch (err: any) {");

fs.writeFileSync("components/AuthPlayer.tsx", c);
