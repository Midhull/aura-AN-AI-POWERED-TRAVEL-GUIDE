import fs from 'fs';
import path from 'path';

const content = fs.readFileSync('.env.local', 'utf8');
console.log("Raw .env.local content:");
console.log(JSON.stringify(content));
console.log("\nParsed project ref:");
const match = content.match(/VITE_SUPABASE_URL=https:\/\/([^\.]+)\.supabase/);
if (match) {
  const ref = match[1];
  console.log(`Ref: "${ref}" (length ${ref.length})`);
  console.log("Char codes:");
  for (let i = 0; i < ref.length; i++) {
    console.log(`  char[${i}]: ${ref[i]} (${ref.charCodeAt(i)})`);
  }
} else {
  console.log("No match found!");
}
