const fs = require("fs");
let p = fs.readFileSync("app/reader/[id]/page.tsx", "utf8");
p = p.replace("export default async function ReaderPage({ params }: { params: { id: string } }) {", 
              "export default async function ReaderPage({ params }: { params: Promise<{ id: string }> }) {");
fs.writeFileSync("app/reader/[id]/page.tsx", p);
