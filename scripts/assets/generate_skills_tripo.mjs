import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

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

const TRIPO_API_KEY = process.env.TRIPO_API_KEY || process.env.VITE_TRIPO_API_KEY;
if (!TRIPO_API_KEY) {
  console.error('ERROR: TRIPO_API_KEY not found');
  process.exit(1);
}

const BASE_URL = 'https://openapi.tripo3d.ai/v3';
const STYLE_SUFFIX = ', chunky vinyl toy, smooth rounded shapes, simple flat colors, no thin parts, soft matte plastic, Saturday-morning cartoon style, game-ready low poly, single object, centered, plain background';
const NEGATIVE_PROMPT = 'realistic, photoreal, thin parts, spikes, text, logo, multiple objects, base plate, floor, noisy texture, baked harsh shadows';

const SKILL_ASSETS = [
  {
    id: 'skill-fist',
    name: 'Giga Fist Boxing Glove',
    prompt: 'chunky oversized red cartoon boxing glove with shiny gold knuckle plate and accordion spring',
    face_limit: 1500,
    file: 'public/models/skills/skill-fist.glb',
    previewFile: 'public/models/skills/skill-fist.webp',
    textureSize: 512,
  },
  {
    id: 'skill-banana',
    name: 'Banana Peel Trap',
    prompt: 'bright yellow cartoon banana peel lying open on the ground with curved floppy peels',
    face_limit: 1200,
    file: 'public/models/skills/skill-banana.glb',
    previewFile: 'public/models/skills/skill-banana.webp',
    textureSize: 512,
  },
  {
    id: 'skill-rocket',
    name: 'Rocket Thruster',
    prompt: 'chunky retro cartoon red and cyan toy rocket with rounded fins and jet nozzle',
    face_limit: 1500,
    file: 'public/models/skills/skill-rocket.glb',
    previewFile: 'public/models/skills/skill-rocket.webp',
    textureSize: 512,
  },
  {
    id: 'skill-magnet',
    name: 'Giga Horseshoe Magnet',
    prompt: 'classic red and blue horseshoe magnet with bright silver chrome magnetic tips and lightning bolts',
    face_limit: 1500,
    file: 'public/models/skills/skill-magnet.glb',
    previewFile: 'public/models/skills/skill-magnet.webp',
    textureSize: 512,
  },
  {
    id: 'skill-bomb',
    name: 'Bounce Bomb',
    prompt: 'chunky glossy black round cartoon cannonball bomb with red fuse neck and fiery spark',
    face_limit: 1500,
    file: 'public/models/skills/skill-bomb.glb',
    previewFile: 'public/models/skills/skill-bomb.webp',
    textureSize: 512,
  },
];

async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${TRIPO_API_KEY}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);

  let attempts = 0;
  while (attempts < 5) {
    attempts++;
    try {
      const res = await fetch(url, options);
      if (res.status === 429) {
        await sleep(attempts * 3000);
        continue;
      }
      const data = await res.json();
      if (data.code !== 0) throw new Error(data.message || JSON.stringify(data));
      return data.data;
    } catch (err) {
      if (attempts >= 5) throw err;
      await sleep(2000);
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollTask(taskId, label = 'task') {
  while (true) {
    await sleep(2500);
    const task = await apiRequest(`/tasks/${taskId}`, 'GET');
    const { status, progress = 0 } = task;
    process.stdout.write(`\r[${label}] Status: ${status} (${progress}%)   `);

    if (status === 'success') {
      console.log(`\n[${label}] Done!`);
      return task;
    }
    if (['failed', 'cancelled', 'banned'].includes(status)) {
      console.log('\n');
      throw new Error(`[${label}] Task failed: ${status}`);
    }
  }
}

async function downloadFile(url, destPath) {
  const dir = path.dirname(destPath);
  fs.mkdirSync(dir, { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
  const buf = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buf));
  console.log(`Downloaded ${destPath} (${(buf.byteLength / 1024).toFixed(1)} KB)`);
}

function optimizeModel(inputGlb, outputGlb, textureSize) {
  fs.mkdirSync(path.dirname(outputGlb), { recursive: true });
  const cmd = `npx -y @gltf-transform/cli optimize "${inputGlb}" "${outputGlb}" --compress meshopt --texture-compress webp --texture-size ${textureSize}`.trim();
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch {
    fs.copyFileSync(inputGlb, outputGlb);
  }
}

async function processSkill(asset) {
  console.log(`\n=== Generating Skill 3D: ${asset.name} (${asset.id}) ===`);
  const fullPrompt = `${asset.prompt}${STYLE_SUFFIX}`;

  const genResult = await apiRequest('/generation/text-to-model', 'POST', {
    model: 'P1-20260311',
    face_limit: asset.face_limit,
    texture: true,
    pbr: false,
    prompt: fullPrompt,
    negative_prompt: NEGATIVE_PROMPT,
  });

  const genTask = await pollTask(genResult.task_id, `${asset.id}`);
  const modelUrl = genTask.output?.model_url;
  const previewUrl = genTask.output?.rendered_image_url;

  if (previewUrl && asset.previewFile) {
    await downloadFile(previewUrl, asset.previewFile);
  }

  const rawGlb = `assets-src/raw/skills/${asset.id}.glb`;
  await downloadFile(modelUrl, rawGlb);
  optimizeModel(rawGlb, asset.file, asset.textureSize);

  return { id: asset.id, modelUrl, previewUrl };
}

async function main() {
  fs.mkdirSync('public/models/skills', { recursive: true });
  fs.mkdirSync('assets-src/raw/skills', { recursive: true });

  const results = [];
  for (const asset of SKILL_ASSETS) {
    if (fs.existsSync(asset.file)) {
      console.log(`Skipping existing ${asset.id}`);
      continue;
    }
    try {
      const res = await processSkill(asset);
      results.push(res);
    } catch (err) {
      console.error(`Failed ${asset.id}:`, err);
    }
  }

  console.log('\nAll Tripo 3D Skill assets generated successfully!');
}

main().catch(console.error);
