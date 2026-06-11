const fs = require('fs');
const path = require('path');

const sessionFile = process.argv[2];

if (!sessionFile) {
  console.error('Usage: node fix-session.js <session-file-path>');
  console.error('Example: node fix-session.js "C:\\Users\\...\\session.jsonl"');
  process.exit(1);
}

if (!fs.existsSync(sessionFile)) {
  console.error(`File not found: ${sessionFile}`);
  process.exit(1);
}

// Create backup
const backupFile = sessionFile + '.backup.' + Date.now();
fs.copyFileSync(sessionFile, backupFile);
console.log(`Backup created: ${backupFile}`);

const content = fs.readFileSync(sessionFile, 'utf-8');
const lines = content.trim().split('\n');

let modified = false;
let emptyTextRemoved = 0;
let imageMessagesFixed = 0;

const newLines = lines.map((line, idx) => {
  try {
    const entry = JSON.parse(line);
    if (entry.type !== 'message') return line;

    const msg = entry.message;
    if (!msg || !msg.content) return line;

    const contentArr = Array.isArray(msg.content) ? msg.content : [{ type: 'text', text: msg.content }];

    // Remove empty text blocks
    const filtered = contentArr.filter((block) => {
      if (block.type === 'text' && (!block.text || block.text.trim() === '')) {
        emptyTextRemoved++;
        modified = true;
        return false;
      }
      return true;
    });

    if (filtered.length !== contentArr.length) {
      imageMessagesFixed++;
      entry.message = {
        ...msg,
        content: filtered.length === 1 && filtered[0].type === 'text'
          ? filtered[0].text
          : filtered,
      };
      return JSON.stringify(entry);
    }

    return line;
  } catch (e) {
    console.error(`[Line ${idx + 1}] Parse error, keeping original: ${e.message}`);
    return line;
  }
});

if (modified) {
  fs.writeFileSync(sessionFile, newLines.join('\n') + '\n');
  console.log(`\nFixed session file: ${sessionFile}`);
  console.log(`  Empty text blocks removed: ${emptyTextRemoved}`);
  console.log(`  Image messages fixed: ${imageMessagesFixed}`);
} else {
  console.log(`\nNo issues found in: ${sessionFile}`);
}
