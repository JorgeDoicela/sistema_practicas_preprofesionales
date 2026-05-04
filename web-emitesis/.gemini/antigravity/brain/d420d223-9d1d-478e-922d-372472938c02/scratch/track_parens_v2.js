
import fs from 'fs';

const content = fs.readFileSync('c:/Users/jorge/Desktop/Proyectos/sistema_practicas_preprofesionales/web-emitesis/src/app/dashboard/documentos/page.tsx', 'utf8');

let stack = [];
for (let i = 0; i < content.length; i++) {
  if (content[i] === '(') {
    stack.push(i);
  } else if (content[i] === ')') {
    if (stack.length === 0) {
      const line = content.substring(0, i).split('\n').length;
      console.log(`Extra closing parenthesis at line ${line}: ${content.substring(i - 20, i + 20)}`);
      break;
    } else {
      stack.pop();
    }
  }
}
