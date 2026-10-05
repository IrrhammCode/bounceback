import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// 1. Load environment variables
function loadEnv() {
  for (const envFile of ['.env.local', '.env']) {
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [key, ...rest] = trimmed.split('=');
        if (key && rest.length > 0 && !process.env[key.trim()]) {
          process.env[key.trim()] = rest.join('=').trim();
        }
      }
    }
  }
}

loadEnv();

const WORLDLABS_API_KEY = process.env.WORLDLABS_API_KEY || process.env.VITE_WORLDLABS_API_KEY;
if (!WORLDLABS_API_KEY) {
  console.error('ERROR: WORLDLABS_API_KEY is not set in environment, .env.local, or .env');
  process.exit(1);
}

const BASE_URL = 'https://api.worldlabs.ai/marble/v1';

const STYLE_SUFFIX = ', Painted diorama, cartoon toy set, soft hand-painted textures, Saturday-morning cartoon style, chunky rounded shapes, gentle light. Keep the center an open empty circular clearing; all scenery around the edges and in the distance. No people, no text, no logos.';

const WORLDS = [
  {
    round: 1,
    id: 'r1',
    name: 'Kado #1: Kamar Masa Kecil (Bedroom Sunrise)',
    prompt: "A giant child's bedroom at 6am on a Saturday seen from toy height: a huge blanket fort, oversized building blocks, a plush teddy bear, an old CRT TV glowing with cartoons, morning sun through curtains.",
  },
  {
    round: 2,
    id: 'r2',
    name: 'Kado #2: Kota Mainan (Toy Block City)',
    prompt: 'A sprawling city built from colorful toy building blocks in primary colors: block skyscrapers, a toy train bridge, toy cars on block roads, puffy cloud props on sticks, bright daylight.',
  },
  {
    round: 3,
    id: 'r3',
    name: 'Kado #3: Layangan Sore (Backyard Kite Season)',
    prompt: 'A sunny suburban backyard in kite season, late afternoon: many colorful kites in an orange-green sky, a garden hose spraying sparkly arcs, a picket fence, a tree with a tire swing.',
  },
  {
    round: 4,
    id: 'r4',
    name: 'Kado #4: Pasar Malam (Indonesian Night Market)',
    prompt: 'An Indonesian pasar malam night market: a glowing carousel, strings of warm light bulbs, wooden gerobak food carts with lanterns, a small Ferris wheel, festive and warm.',
  },
  {
    round: 5,
    id: 'r5',
    name: 'Kado #5: Atap Penuh Bintang (Rooftop Under Stars)',
    prompt: 'A cozy rooftop at night under a sky full of stars and a big moon, city lights far below, fairy lights on the railing, one big glowing wrapped gift box with a ribbon in the distance.',
  },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'WLT-Api-Key': WORLDLABS_API_KEY,
      'Content-Type': 'application/json',
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  let attempts = 0;
  while (attempts < 6) {
    attempts++;
    try {
      const res = await fetch(url, options);
      if (res.status === 429) {
        console.warn(`[429 Rate Limit] Backing off for ${attempts * 4}s...`);
        await sleep(attempts * 4000);
        continue;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(`World Labs API error: ${JSON.stringify(data)} (status: ${res.status})`);
      }
      return data;
    } catch (err) {
      if (attempts >= 6) throw err;
      console.warn(`Request failed (${err.message}). Retrying in 3s...`);
      await sleep(3000);
    }
  }
}

function downloadFile(url, destPath) {
  console.log(`Downloading ${url} -> ${destPath}`);
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  execSync(`curl -s -L --retry 3 -o "${destPath}" "${url}"`);
  const stats = fs.statSync(destPath);
  console.log(`Saved ${destPath} (${(stats.size / 1024).toFixed(1)} KB)`);
}

async function generateWorld(worldDef, options = {}) {
  const { round, id, name, prompt } = worldDef;
  const fullPrompt = `${prompt}${STYLE_SUFFIX}`;
  const jsonPath = `assets-src/worldlabs/${id}.json`;
  const outDir = `public/worlds/${id}`;

  console.log(`\n==================================================`);
  console.log(`[Round ${round}] ${name}`);
  console.log(`Prompt: ${fullPrompt}`);
  console.log(`==================================================`);

  if (!options.force && fs.existsSync(`public/worlds/${id}/100k.spz`) && fs.existsSync(`public/worlds/${id}/500k.spz`)) {
    console.log(`✓ World assets already exist for Round ${round} (${outDir}). Skipping.`);
    return;
  }

  // 1. Submit generate request
  console.log(`Starting generation with model: marble-1.0-draft...`);
  const displayName = `BounceBack ${id} - ${name}`.slice(0, 50);
  const createResp = await apiRequest('/worlds:generate', 'POST', {
    display_name: displayName,
    model: 'marble-1.0-draft',
    world_prompt: {
      type: 'text',
      text_prompt: fullPrompt,
    },
  });

  const operationId = createResp.operation_id;
  console.log(`Operation ID: ${operationId}`);

  // 2. Poll until complete
  let operation;
  const startTime = Date.now();
  while (true) {
    await sleep(5000);
    operation = await apiRequest(`/operations/${operationId}`, 'GET');
    const elapsed = Math.round((Date.now() - startTime) / 1000);

    if (operation.done) {
      if (operation.error) {
        throw new Error(`Generation failed for Round ${round}: ${JSON.stringify(operation.error)}`);
      }
      console.log(`✓ Operation completed in ${elapsed}s!`);
      break;
    } else {
      const progressDesc = operation.metadata?.progress?.description || 'Generating...';
      console.log(`[${elapsed}s] ${progressDesc}`);
    }
  }

  // 3. Save raw response JSON
  if (!fs.existsSync('assets-src/worldlabs')) fs.mkdirSync('assets-src/worldlabs', { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(operation, null, 2));
  console.log(`Saved metadata to ${jsonPath}`);

  // 4. Download 100k, 500k, and thumbnail / pano
  const assets = operation.response?.assets;
  if (!assets) {
    throw new Error(`No assets found in operation response: ${JSON.stringify(operation)}`);
  }

  const spz100k = assets.splats?.spz_urls?.['100k'];
  const spz500k = assets.splats?.spz_urls?.['500k'];
  const panoUrl = assets.imagery?.pano_url;
  const thumbUrl = assets.thumbnail_url || operation.response?.thumbnail_url;

  if (spz100k) {
    await downloadFile(spz100k, `public/worlds/${id}/100k.spz`);
  }
  if (spz500k) {
    await downloadFile(spz500k, `public/worlds/${id}/500k.spz`);
  }
  if (panoUrl) {
    await downloadFile(panoUrl, `public/worlds/${id}/pano.jpg`);
  } else if (thumbUrl) {
    await downloadFile(thumbUrl, `public/worlds/${id}/pano.webp`);
  }

  // Keep a small metadata file in public for the client
  fs.writeFileSync(
    `public/worlds/${id}/info.json`,
    JSON.stringify(
      {
        round,
        id,
        name,
        worldId: operation.response?.world_id,
        caption: operation.response?.caption,
        has100k: !!spz100k,
        has500k: !!spz500k,
        hasPano: !!(panoUrl || thumbUrl),
      },
      null,
      2
    )
  );
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const targetArg = args.find((a) => !a.startsWith('--'));

  let targets = WORLDS;
  if (targetArg && targetArg !== 'all') {
    const roundNum = parseInt(targetArg, 10);
    targets = WORLDS.filter((w) => w.round === roundNum || w.id === targetArg);
    if (targets.length === 0) {
      console.error(`Target "${targetArg}" not found. Available: 1, 2, 3, 4, 5, or all`);
      process.exit(1);
    }
  }

  console.log(`World Labs Generator starting for ${targets.length} world(s)...`);

  for (let i = 0; i < targets.length; i++) {
    const worldDef = targets[i];
    await generateWorld(worldDef, { force });

    // Rate limit safeguard: pause 10s between creations if multiple
    if (i < targets.length - 1) {
      console.log('Pausing 10s before next world request...');
      await sleep(10000);
    }
  }

  // Generate manifest
  const manifest = {
    updatedAt: new Date().toISOString(),
    worlds: {},
  };
  for (const w of WORLDS) {
    const infoPath = `public/worlds/${w.id}/info.json`;
    if (fs.existsSync(infoPath)) {
      manifest.worlds[w.id] = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
    }
  }
  fs.writeFileSync('public/worlds/manifest.json', JSON.stringify(manifest, null, 2));
  console.log(`\nAll done! Manifest written to public/worlds/manifest.json`);
}

main().catch((err) => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
