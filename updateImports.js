const fs = require("fs");
let c = fs.readFileSync("app/dashboard/audiobooks/SampleBooks.tsx", "utf8");
c = c.replace("../../utils/supabase/client", "../../../utils/supabase/client");
fs.writeFileSync("app/dashboard/audiobooks/SampleBooks.tsx", c);
