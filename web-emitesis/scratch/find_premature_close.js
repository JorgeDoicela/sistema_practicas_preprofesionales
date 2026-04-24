const fs = require('fs');

function findPrematureClose(path) {
    console.log(`Analyzing ${path}...`);
    const lines = fs.readFileSync(path, 'utf8').split('\n');
    let balance = 0;
    let mainObjectStarted = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (let j = 0; j < line.length; j++) {
            if (line[j] === '{') {
                balance++;
                if (balance === 1) mainObjectStarted = true;
            }
            if (line[j] === '}') {
                balance--;
                if (balance === 0 && mainObjectStarted && i < lines.length - 2) {
                    console.log(`Object closed at line ${i + 1}: ${line.trim()}`);
                }
            }
        }
    }
}

findPrematureClose('src/i18n/es.ts');
findPrematureClose('src/i18n/en.ts');
