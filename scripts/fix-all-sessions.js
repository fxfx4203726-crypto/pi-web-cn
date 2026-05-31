const fs = require('fs');
const path = require('path');

const sessionsDir = 'C:\\Users\\Administrator\\.pi\\agent\\sessions\\--Z--pi agent--';

const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl') && !f.endsWith('.backup'));

for (const file of files) {
  const filePath = path.join(sessionsDir, file);
  console.log(`\n=== Checking: ${file} ===`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  let emptyTextCount = 0;
  let imageCount = 0;

  for (let i = 0; i < lines.length; i++) {
    try {
      const entry = JSON.parse(lines[i]);
      if (entry.type !== 'message') continue;

      const msg = entry.message;
      if (!msg || !msg.content) continue;

      const contentArr = Array.isArray(msg.content) ? msg.content : [{ type: 'text', text: msg.content }];

      for (const block of contentArr) {
        if (block.type === 'text' && (!block.text || block.text.trim() === '')) {
          emptyTextCount++;
          console.log(`  [Line ${i + 1}] Empty text block in ${msg.role} message`);
        }
        if (block.type === 'image') {
          imageCount++;
        }
      }
    } catch (e) {
      // ignore parse errors
    }
  }

  console.log(`  Images: ${imageCount}, Empty text blocks: ${emptyTextCount}`);

  if (emptyTextCount > 0) {
    // Fix this file
    const backupFile = filePath + '.backup.' + Date.now();
    fs.copyFileSync(filePath, backupFile);
    console.log(`  Backup: ${backupFile}`);

    let modified = false;
    const newLines = lines.map((line) => {
      try {
        const entry = JSON.parse(line);
        if (entry.type !== 'message') return line;

        const msg = entry.message;
        if (!msg || !msg.content) return line;

        const contentArr = Array.isArray(msg.content) ? msg.content : [{ type: 'text', text: msg.content }];
        const filtered = contentArr.filter((block) => {
          if (block.type === 'text' && (!block.text || block.text.trim() === '')) {
            modified = true;
            return false;
          }
          return true;
        });

        if (filtered.length !== contentArr.length) {
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
        return line;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, newLines.join('\n') + '\n');
      console.log(`  FIXED!`);
    }
  }
}

console.log('\nDone!');
