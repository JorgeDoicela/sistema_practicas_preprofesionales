const fs = require('fs');

const path = 'src/i18n/es.ts';
let content = fs.readFileSync(path, 'utf8');

// Remove the corrupted block from line 603 to 686
const lines = content.split('\n');
const startIdx = 602; // Line 603 (0-indexed)
const endIdx = 685;   // Line 686 (0-indexed)

if (lines[startIdx].includes('clockLabel') && lines[endIdx].trim() === '},') {
    console.log('Found corrupted block at 603-686, removing...');
    lines.splice(startIdx, endIdx - startIdx + 1);
}

// Check for other premature closes and fix them
// This is more complex, so let's just do the obvious one first.

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Fixed es.ts');
