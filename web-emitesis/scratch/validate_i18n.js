const fs = require('fs');

function checkFile(path) {
    console.log(`Checking ${path}...`);
    const content = fs.readFileSync(path, 'utf8');
    let braces = 0;
    let brackets = 0;
    for (let i = 0; i < content.length; i++) {
        if (content[i] === '{') braces++;
        if (content[i] === '}') braces--;
        if (content[i] === '[') brackets++;
        if (content[i] === ']') brackets--;
    }
    console.log(`Braces balance: ${braces}`);
    console.log(`Brackets balance: ${brackets}`);
    
    try {
        // Very basic validation by removing 'export const en =' and 'as const;'
        let testContent = content.replace(/export const \w+ = /, '').replace(/ as const;/, '');
        // This is not perfect for complex TS objects but might catch obvious stuff
        // eval('(' + testContent + ')'); 
    } catch (e) {
        console.log(`Eval error: ${e.message}`);
    }
}

checkFile('src/i18n/es.ts');
checkFile('src/i18n/en.ts');
