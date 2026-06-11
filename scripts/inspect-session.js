const fs = require('fs');
const path = require('path');

const sessionFile = process.argv[2] || 'C:\\Users\\Administrator\\.pi\\agent\\sessions\\--Z--pi agent--\\2026-05-31T07-05-57-073Z_019e7cda-8851-7f66-819c-da62d554549e.jsonl';

const content = fs.readFileSync(sessionFile, 'utf-8');
const lines = content.trim().split('\n');

let imageCount = 0;
let problematicImages = 0;
let emptyTextCount = 0;

for (let i = 0; i < lines.length; i++) {
  try {
    const entry = JSON.parse(lines[i]);
    if (entry.type !== 'message') continue;

    const msg = entry.message;
    if (!msg || !msg.content) continue;

    const contentArr = Array.isArray(msg.content) ? msg.content : [{ type: 'text', text: msg.content }];

    for (const block of contentArr) {
      if (block.type === 'text' && block.text === '') {
        emptyTextCount++;
        console.log(`[Line ${i + 1}] Empty text block in ${msg.role} message`);
      }
      if (block.type === 'image') {
        imageCount++;
        const issues = [];

        if (!block.data) {
          issues.push('missing data');
        } else if (block.data.startsWith('blob:')) {
          issues.push('blob URL instead of base64');
        } else if (block.data.startsWith('http')) {
          issues.push('http URL instead of base64');
        } else {
          // Check if valid base64
          const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
          const cleanData = block.data.replace(/\s/g, '');
          if (!base64Pattern.test(cleanData)) {
            issues.push('invalid base64 characters');
          }
          if (cleanData.length < 100) {
            issues.push(`very short data (${cleanData.length} chars)`);
          }
        }

        if (!block.mimeType && !block.source) {
          issues.push('no mimeType or source');
        }

        if (issues.length > 0) {
          problematicImages++;
          console.log(`[Line ${i + 1}] ${msg.role} image: ${issues.join(', ')}`);
          if (block.data) {
            console.log(`  data prefix: ${block.data.substring(0, 50)}...`);
          }
        }
      }
    }
  } catch (e) {
    console.log(`[Line ${i + 1}] JSON parse error: ${e.message}`);
  }
}

console.log(`\nSummary:`);
console.log(`  Total image blocks: ${imageCount}`);
console.log(`  Problematic images: ${problematicImages}`);
console.log(`  Empty text blocks: ${emptyTextCount}`);
