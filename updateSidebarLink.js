const fs = require("fs");
let c = fs.readFileSync("app/dashboard/Sidebar.tsx", "utf8");
c = c.replace("{ href: '/audiobooks', label: '오디오북', icon: Headphones },", "{ href: '/dashboard/audiobooks', label: '오디오북', icon: Headphones },");
fs.writeFileSync("app/dashboard/Sidebar.tsx", c);

let p = fs.readFileSync("components/Player.tsx", "utf8");
p = p.replace('href="/audiobooks"', 'href="/dashboard/audiobooks"');
fs.writeFileSync("components/Player.tsx", p);
