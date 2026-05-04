
import fs from 'fs';

const content = fs.readFileSync('c:/Users/jorge/Desktop/Proyectos/sistema_practicas_preprofesionales/web-emitesis/src/app/dashboard/documentos/page.tsx', 'utf8');

const tags = ['div', 'section', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'Link', 'button', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'input', 'select', 'option', 'label', 'DashboardLayout', 'AnimatePresence', 'motion.div', 'TwoFactorModal', 'DoubleConfirmationModal'];

tags.forEach(tag => {
  const open = (content.match(new RegExp(`<${tag}[\\s/>]`, 'g')) || []).length;
  const close = (content.match(new RegExp(`</${tag}>`, 'g')) || []).length;
  if (open !== close) {
    console.log(`${tag}: Open=${open}, Close=${close}`);
  }
});

const openBraces = (content.match(/{/g) || []).length;
const closeBraces = (content.match(/}/g) || []).length;
console.log(`Braces: Open=${openBraces}, Close=${closeBraces}`);

const openParens = (content.match(/\(/g) || []).length;
const closeParens = (content.match(/\)/g) || []).length;
console.log(`Parens: Open=${openParens}, Close=${closeParens}`);
