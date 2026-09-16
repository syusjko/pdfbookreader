const fs = require("fs");
let c = fs.readFileSync("components/AuthPlayer.tsx", "utf8").split("\n");

const start = 327; // line 328
const end = 480;   // up to line 480 (exclusive, so we keep `return (`)

const before = c.slice(0, start).join("\n");
const after = c.slice(end).join("\n");

const newLanding = `  if (sentences.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="font-bold text-lg text-gray-800">{loadingText || "오디오북을 불러오는 중..."}</p>
      </div>
    );
  }
`;

fs.writeFileSync("components/AuthPlayer.tsx", before + "\n" + newLanding + "\n" + after);
