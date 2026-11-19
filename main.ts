// Leonida Trophy Guide — entrypoint (Node 22, standard library only).
//
// This file is the program the grader runs: it checks the guide data in
// app/data/trophies.json, stages the finished app into the output folder,
// and asks the vendored make.fun library to write dossier.json, the summary
// the judge reads. The guide itself lives in app/ (plain static files, no
// build step, nothing fetched over the network); the four screenshots live
// in screenshots/ and the first one by name is the cover.
//
// Two promises this file keeps, in this order: (1) it never hands in a
// guide it has not checked — a trophy with a blank name, description,
// grade or guide, a step with no citation, or a counter with a nonsense
// target stops the build with a message naming the first problem; (2) the
// dossier it writes is byte for byte the one the scorer's own copy of the
// vendored library writes, because it calls that library with the exact
// caps the scorer uses and never edits the library.
//
// Run it locally with: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app locally with: node serve.ts (then http://localhost:8080).

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath as urlToPath } from 'node:url';
import { buildDossier as makeDossier } from './vendor/makefun-frontend.ts';

// Stop the build with a message the person running it can act on.
function fail(message) {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

// Read a JSON file, blaming the file (not the caller) when it is missing
// or malformed.
function readJsonFile(path) {
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch (err) {
    fail(`cannot read ${path}: ${err.message}`);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    fail(`invalid JSON in ${path}: ${err.message}`);
  }
}

// How many trophies the guide must hold, and what each one must carry.
const TROPHY_COUNT = 55;
const REQUIRED_TEXT = ['name', 'description', 'grade', 'guide'];

// Check the whole trophy list and count what the build summary reports.
// Returns { trophies, counters, sources }. Stops at the first problem.
function checkGuideData(data) {
  if (!data || !Array.isArray(data.trophies)) {
    fail('trophies.json: expected an object with a "trophies" array at the top');
  }
  if (data.trophies.length !== TROPHY_COUNT) {
    fail(`trophies.json: expected ${TROPHY_COUNT} trophies, found ${data.trophies.length}`);
  }
  const sourceNames = new Set();
  let counters = 0;
  data.trophies.forEach((trophy, index) => {
    const where = `trophy #${trophy?.id ?? index + 1}`;
    for (const field of REQUIRED_TEXT) {
      if (typeof trophy?.[field] !== 'string' || trophy[field].trim() === '') {
        fail(`${where}: "${field}" is missing or blank`);
      }
    }
    if (!Array.isArray(trophy.steps) || trophy.steps.length === 0) {
      fail(`${where}: "steps" must be a non-empty list`);
    }
    trophy.steps.forEach((step, stepIndex) => {
      if (typeof step?.text !== 'string' || step.text.trim() === '') {
        fail(`${where} step ${stepIndex + 1}: text is missing or blank`);
      }
      if (!Array.isArray(step.cites) || step.cites.length === 0) {
        fail(`${where} step ${stepIndex + 1}: no citation`);
      }
    });
    const hasSource = Array.isArray(trophy.sources) && trophy.sources.length > 0;
    const hasGuideCite = Array.isArray(trophy.guideCites) && trophy.guideCites.length > 0;
    if (!hasSource && !hasGuideCite) {
      fail(`${where}: no citation — needs at least one source or guide citation`);
    }
    for (const source of trophy.sources ?? []) {
      if (typeof source?.name === 'string' && source.name.trim() !== '') sourceNames.add(source.name);
    }
    if (trophy.counter !== undefined && trophy.counter !== null) {
      if (typeof trophy.counter.target !== 'number' || !(trophy.counter.target > 0)) {
        fail(`${where}: counter target must be a positive number`);
      }
      counters += 1;
    }
  });
  return { trophies: data.trophies.length, counters, sources: sourceNames.size };
}

// The scorer's caps, exactly as the scorer states them: the text budget
// shapes the dossier bytes, and the rest refuse an entry the scorer would
// refuse (more than four screenshots, one over 256 KiB, more than 993
// files or directories under app/, or 48 MiB of app files).
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

const repoRoot = urlToPath(new URL('./', import.meta.url));
const targetDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const guideStats = checkGuideData(readJsonFile(join(repoRoot, 'app', 'data', 'trophies.json')));

mkdirSync(targetDir, { recursive: true });
for (const folder of ['app', 'screenshots']) {
  const source = join(repoRoot, folder);
  if (existsSync(source)) cpSync(source, join(targetDir, folder), { recursive: true });
}

const dossierPath = join(targetDir, 'dossier.json');
writeFileSync(dossierPath, makeDossier(targetDir, DOSSIER_CAPS));

const shotDir = join(targetDir, 'screenshots');
const shotCount = existsSync(shotDir)
  ? readdirSync(shotDir).filter((name) => /\.(jpe?g|png)$/i.test(name)).length
  : 0;
const dossierBytes = statSync(dossierPath).size;
console.log(
  `Leonida Trophy Guide built: ${guideStats.trophies} trophies, ` +
  `${guideStats.counters} progress counters, ${guideStats.sources} sources, ` +
  `${shotCount} screenshots, dossier ${dossierBytes} bytes -> ${dossierPath}`,
);
