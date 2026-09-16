const fs = require('fs');
let code = fs.readFileSync('components/AuthPlayer.tsx', 'utf8');

const firstAuthPlayer = code.indexOf('export default function AuthPlayer');
const secondAuthPlayer = code.indexOf('export default function AuthPlayer', firstAuthPlayer + 10);

if (secondAuthPlayer !== -1) {
  const blockStart = 0;
  const blockEnd = code.indexOf('  const [isLoading, setIsLoading] = useState(false);');
  
  const duplicatedBlock = code.substring(blockStart, blockEnd);
  
  const lastIndex = code.lastIndexOf(duplicatedBlock);
  if (lastIndex > 0) {
    code = code.substring(0, lastIndex) + code.substring(lastIndex + duplicatedBlock.length);
    fs.writeFileSync('components/AuthPlayer.tsx', code);
    console.log('Removed duplicate block');
  } else {
    console.log('Could not find exact duplicate block');
  }
}
