const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node check-session.js <file>');
  process.exit(1);
}

const content = fs.readFileSync(file, 'utf-8');
const lines = content.trim().split('\n');

let errors = 0;
let valid = 0;
let imagePlaceholders = 0;
let imageReal = 0;
let emptyTextBlocks = 0;

for (let i = 0; i < lines.length; i++) {
  try {
    const entry = JSON.parse(lines[i]);
    valid++;

    if (entry.type === 'message' && entry.message?.content) {
      const arr = Array.isArray(entry.message.content) ? entry.message.content : [{type:'text',text:entry.message.content}];
      for (const block of arr) {
        if (block.type === 'image') {
          if (typeof block.data === 'string' && block.data.startsWith('[IMAGE_DATA_REMOVED')) {
            imagePlaceholders++;
          } else if (typeof block.data === 'string' && block.data.length > 100) {
            imageReal++;
          }
        }
        if (block.type === 'text' && (!block.text || block.text.trim() === '')) {
          emptyTextBlocks++;
          console.log(`[Line ${i+1}] Empty text block in ${entry.message.role} message`);
        }
      }
    }
  } catch (e) {
    errors++;
    console.log(`[Line ${i+1}] INVALID JSON: ${e.message}`);
    console.log(`  Content: ${lines[i].substring(0, 100)}...`);
  }
}

console.log(`\nTotal lines: ${lines.length}`);
console.log(`Valid JSON: ${valid}`);
console.log(`Invalid JSON: ${errors}`);
console.log(`Image placeholders: ${imagePlaceholders}`);
console.log(`Real image data: ${imageReal}`);
console.log(`Empty text blocks: ${emptyTextBlocks}`);
