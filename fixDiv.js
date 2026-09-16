const fs = require("fs");
let c = fs.readFileSync("components/AuthPlayer.tsx", "utf8");
c = c.replace(
  "        </div>\n      </div>\n\n      <audio",
  "        </div>\n      </div>\n      </div>\n\n      <audio"
);
fs.writeFileSync("components/AuthPlayer.tsx", c);
