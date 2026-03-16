const fs = require('fs');
const path = require('path');

const logPath = path.join(__dirname, 'nest_output.log');
const outPath = path.join(__dirname, 'nest_output_utf8.log');

if (fs.existsSync(logPath)) {
    const content = fs.readFileSync(logPath, 'utf16le');
    fs.writeFileSync(outPath, content, 'utf8');
    console.log('Converted log to UTF-8');
} else {
    console.log('Log file not found');
}
