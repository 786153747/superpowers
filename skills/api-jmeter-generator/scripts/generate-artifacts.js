#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const { generatePostman } = require('./generate-postman');

function main() {
  const sourceJsonPath = process.argv[2];
  if (!sourceJsonPath) {
    console.error('Usage: node scripts/generate-artifacts.js <json-file-path> [output-dir]');
    process.exit(1);
  }

  const absSourceJsonPath = path.resolve(sourceJsonPath);
  if (!fs.existsSync(absSourceJsonPath)) {
    console.error(`File not found: ${absSourceJsonPath}`);
    process.exit(1);
  }

  const outputDir = path.resolve(process.argv[3] || path.dirname(absSourceJsonPath));
  fs.mkdirSync(outputDir, { recursive: true });

  const apiJsonPath = path.join(outputDir, 'api.json');
  if (path.normalize(absSourceJsonPath) !== path.normalize(apiJsonPath)) {
    fs.copyFileSync(absSourceJsonPath, apiJsonPath);
  }

  const postmanPath = path.join(outputDir, 'postman.json');
  generatePostman(apiJsonPath, postmanPath);

  const jmxPath = path.join(outputDir, 'jmeter-test-plan.jmx');
  const jmxScriptPath = path.join(__dirname, 'generate-jmx.js');
  const jmxResult = spawnSync(
    process.execPath,
    [jmxScriptPath, apiJsonPath, jmxPath],
    { stdio: 'inherit' }
  );

  if (jmxResult.error) {
    throw jmxResult.error;
  }
  if (jmxResult.status !== 0) {
    process.exit(jmxResult.status || 1);
  }

  console.log('Generated artifacts:');
  console.log(`- api.json: ${apiJsonPath}`);
  console.log(`- postman.json: ${postmanPath}`);
  console.log(`- jmx: ${jmxPath}`);
}

if (require.main === module) {
  main();
}
