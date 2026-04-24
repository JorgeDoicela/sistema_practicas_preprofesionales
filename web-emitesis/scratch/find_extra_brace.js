const fs = require('fs');

function findExtraBrace(path) {
    console.log(`Analyzing ${path}...`);
    const lines = fs.readFileSync(path, 'utf8').split('\n');
    let balance = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (let j = 0; j < line.length; j++) {
            if (line[j] === '{') balance++;
            if (line[j] === '}') balance--;
            if (balance < 0) {
                console.log(`Extra closing brace found at line ${i + 1}, col ${j + 1}: ${line.trim()}`);
                balance = 0; // Reset to find more if any
            }
        }
    }
    console.log(`Final balance: ${balance}`);
}

findExtraBrace('src/i18n/es.ts');
findExtraBrace('src/i18n/en.ts');
