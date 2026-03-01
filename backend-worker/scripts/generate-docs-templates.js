#!/usr/bin/env node
// Generate docs templates from HTML/CSS files
const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '../docs');
const outputFile = path.join(__dirname, '../src/routes/docs-content.ts');

function escapeTemplate(str) {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

const files = {
  indexHtml: 'index.html',
  apiReferenceHtml: 'api-reference.html',
  architectureHtml: 'architecture.html',
  x402Html: 'x402.html',
  stylesCss: 'styles.css'
};

let output = '// Auto-generated file - do not edit\n// Run: node scripts/generate-docs-templates.js to regenerate\n\n';

for (const [varName, filename] of Object.entries(files)) {
  const content = fs.readFileSync(path.join(docsDir, filename), 'utf-8');
  output += `export const ${varName} = \`${escapeTemplate(content)}\`;\n\n`;
}

fs.writeFileSync(outputFile, output);
console.log('✓ Generated docs-content.ts');
