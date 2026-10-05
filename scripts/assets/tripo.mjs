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

const TRIPO_API_KEY = process.env.TRIPO_API_KEY || process.env.VITE_TRIPO_API_KEY;
if (!TRIPO_API_KEY) {
  console.error('ERROR: TRIPO_API_KEY is not set in environment, .env.local, or .env');
  process.exit(1);
}

const BASE_URL = 'https://openapi.tripo3d.ai/v3';

const STYLE_SUFFIX = ', chunky vinyl toy, smooth rounded shapes, simple flat colors, no thin parts, soft matte plastic, Saturday-morning cartoon style, game-ready low poly, single object, centered, plain background';
const NEGATIVE_PROMPT = 'realistic, photoreal, thin parts, spikes, text, logo, multiple objects, base plate, floor, noisy texture, baked harsh shadows';

const ASSETS = [
  {
    id: 'fighter',
    name: 'Fighter Base',
    prompt: 'chunky chibi vinyl toy figure, 2.5-head proportions, big round eyes, small smile, white and light grey body suit, rounded mitten hands, chunky boots, T-pose with arms straight out',
    face_limit: 5000,
    rig: true,
    file: 'public/models/fighter.glb',
    textureSize: 1024,
  },
  {
    id: 'acc-bow',
    name: 'Cyan accessory (Bow)',
    prompt: 'big satin ribbon bow hair accessory',
    face_limit: 800,
    rig: false,
    file: 'public/models/acc-bow.glb',
    textureSize: 512,
  },
  {
    id: 'acc-partyhat',
    name: 'Coral accessory (Party Hat)',
    prompt: 'cone party hat with pom-pom',
    face_limit: 800,
    rig: false,
    file: 'public/models/acc-partyhat.glb',
    textureSize: 512,
  },
  {
    id: 'acc-crown',
    name: 'Player Crown',
    prompt: 'small cartoon golden crown with round gems',
    face_limit: 1000,
    rig: false,
    file: 'public/models/acc-crown.glb',
    textureSize: 512,
  },
  {
    id: 'bumper',
    name: 'Bumper',
    prompt: 'round toy pinball bumper shaped like a wrapped gift mushroom, ribbon around the rim',
    face_limit: 2000,
    rig: false,
    file: 'public/models/bumper.glb',
    textureSize: 512,
  },
  {
    id: 'mystery-gift',
    name: 'Mystery Gift Box',
    prompt: 'cube gift box with a big ribbon bow and a question-mark tag',
    face_limit: 1500,
    rig: false,
    file: 'public/models/mystery-gift.glb',
    textureSize: 512,
  },
  {
    id: 'host-gift',
    name: 'Host Gift Present',
    prompt: 'large wrapped present with separate lid and big bow',
    face_limit: 2500,
    rig: false,
    file: 'public/models/host-gift.glb',
    textureSize: 512,
  },
  {
    id: 'trophy',
    name: 'Trophy Cup',
    prompt: 'cartoon golden trophy cup shaped like a gift box with ribbon handles',
    face_limit: 2500,
    rig: false,
    file: 'public/models/trophy.glb',
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
  if (body) {
    options.body = JSON.stringify(body);
  }

  let attempts = 0;
  while (attempts < 5) {
    attempts++;
    try {
      const res = await fetch(url, options);
      if (res.status === 429) {
        console.warn(`[429 Rate Limit] Backing off for ${attempts * 3}s...`);
        await sleep(attempts * 3000);
        continue;
      }
      const data = await res.json();
      if (data.code !== 0) {
        throw new Error(`Tripo API error: ${data.message || JSON.stringify(data)} (code: ${data.code})`);
      }
      return data.data;
    } catch (err) {
      if (attempts >= 5) throw err;
      console.warn(`Request failed (${err.message}). Retrying in 2s...`);
      await sleep(2000);
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollTask(taskId, label = 'task') {
  console.log(`[${label}] Polling task: ${taskId}`);
  while (true) {
    await sleep(2500);
    const task = await apiRequest(`/tasks/${taskId}`, 'GET');
    const { status, progress = 0 } = task;
    process.stdout.write(`\r[${label}] Status: ${status} (${progress}%)   `);

    if (status === 'success') {
      console.log(`\n[${label}] Task completed successfully!`);
      return task;
    }
    if (['failed', 'cancelled', 'banned'].includes(status)) {
      console.log('\n');
      throw new Error(`[${label}] Task ${taskId} failed with status: ${status}`);
    }
  }
}

async function downloadFile(url, destPath) {
  const dir = path.dirname(destPath);
  fs.mkdirSync(dir, { recursive: true });
  console.log(`Downloading: ${url.slice(0, 80)}... -> ${destPath}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buffer));
  console.log(`Downloaded ${destPath} (${(buffer.byteLength / 1024).toFixed(1)} KB)`);
}

function optimizeModel(inputGlb, outputGlb, isSkinned, textureSize) {
  console.log(`Optimizing ${inputGlb} -> ${outputGlb} (skinned: ${isSkinned}, textureSize: ${textureSize})...`);
  fs.mkdirSync(path.dirname(outputGlb), { recursive: true });

  const skinFlags = isSkinned ? '--flatten false --join false' : '';
  const cmd = `npx -y @gltf-transform/cli optimize "${inputGlb}" "${outputGlb}" --compress meshopt --texture-compress webp --texture-size ${textureSize} ${skinFlags}`.trim();
  console.log(`> ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit' });
    const stat = fs.statSync(outputGlb);
    console.log(`Optimized ${outputGlb}: ${(stat.size / 1024).toFixed(1)} KB`);
  } catch (err) {
    console.error(`Warning: gltf-transform failed (${err.message}), falling back to direct copy`);
    fs.copyFileSync(inputGlb, outputGlb);
  }
}

async function generateFighter(asset) {
  console.log(`\n========================================`);
  console.log(`Generating Fighter Base (chibi vinyl toy + rig + retarget)`);
  console.log(`========================================`);

  const fullPrompt = `${asset.prompt}${STYLE_SUFFIX}`;
  console.log(`Prompt: "${fullPrompt}"`);

  // Step 1: Text-to-model
  console.log('\n1. Creating text-to-model task...');
  const genResult = await apiRequest('/generation/text-to-model', 'POST', {
    model: 'P1-20260311',
    face_limit: asset.face_limit,
    texture: true,
    pbr: false,
    prompt: fullPrompt,
    negative_prompt: NEGATIVE_PROMPT,
  });
  const genTask = await pollTask(genResult.task_id, 'fighter:text-to-model');

  // Step 2: Rig check
  console.log('\n2. Checking rigging capability...');
  const rigCheckResult = await apiRequest('/animations/rig-check', 'POST', {
    original_model_task_id: genTask.task_id,
  });
  const rigCheckTask = await pollTask(rigCheckResult.task_id, 'fighter:rig-check');
  console.log(`Rig check output:`, JSON.stringify(rigCheckTask.output));

  // Step 3: Rigging
  console.log('\n3. Rigging model (biped/mixamo)...');
  let rigModel = 'v1.0-20240301';
  let rigResult;
  try {
    rigResult = await apiRequest('/animations/rig', 'POST', {
      original_model_task_id: genTask.task_id,
      model: rigModel,
      rig_type: 'biped',
      spec: 'mixamo',
      out_format: 'glb',
    });
  } catch (err) {
    console.warn(`v1.0 rig failed to initiate (${err.message}), trying v2.5...`);
    rigModel = 'v2.5-20260210';
    rigResult = await apiRequest('/animations/rig', 'POST', {
      original_model_task_id: genTask.task_id,
      model: rigModel,
      rig_type: 'biped',
      out_format: 'glb',
    });
  }
  const rigTask = await pollTask(rigResult.task_id, 'fighter:rig');

  // Step 4: Retarget animations
  console.log('\n4. Retargeting biped animations (idle, run, jump, hurt, fall)...');
  const animPresets = rigModel === 'v1.0-20240301'
    ? ['preset:biped:idle', 'preset:biped:run', 'preset:biped:jump', 'preset:biped:hurt', 'preset:biped:fall']
    : ['preset:idle', 'preset:run', 'preset:jump', 'preset:hurt', 'preset:fall'];

  const retargetResult = await apiRequest('/animations/retarget', 'POST', {
    original_model_task_id: rigTask.task_id,
    animations: animPresets,
    out_format: 'glb',
    bake_animation: true,
    animate_in_place: true,
  });
  const retargetTask = await pollTask(retargetResult.task_id, 'fighter:retarget');

  // Step 5: Save task JSON & download GLB
  const taskMeta = {
    id: asset.id,
    prompt: fullPrompt,
    negative_prompt: NEGATIVE_PROMPT,
    face_limit: asset.face_limit,
    tripoTaskIds: {
      generation: genTask.task_id,
      rigCheck: rigCheckTask.task_id,
      rig: rigTask.task_id,
      retarget: retargetTask.task_id,
    },
    outputUrls: {
      rawModel: genTask.output?.model_url,
      riggedModel: rigTask.output?.model_url,
      retargetedModel: retargetTask.output?.model_url,
      renderedImage: genTask.output?.rendered_image_url,
    },
    completedAt: new Date().toISOString(),
  };

  fs.mkdirSync('assets-src/tripo', { recursive: true });
  fs.writeFileSync(`assets-src/tripo/${asset.id}.json`, JSON.stringify(taskMeta, null, 2));
  console.log(`Saved metadata to assets-src/tripo/${asset.id}.json`);

  const rawGlb = `assets-src/raw/${asset.id}.glb`;
  const finalGlb = asset.file;
  const downloadUrl = retargetTask.output?.model_url || rigTask.output?.model_url || genTask.output?.model_url;
  await downloadFile(downloadUrl, rawGlb);

  // Step 6: Optimize
  optimizeModel(rawGlb, finalGlb, true, asset.textureSize);

  return taskMeta;
}

async function generateProp(asset) {
  console.log(`\n========================================`);
  console.log(`Generating Prop: ${asset.name} (${asset.id})`);
  console.log(`========================================`);

  const fullPrompt = `${asset.prompt}${STYLE_SUFFIX}`;
  console.log(`Prompt: "${fullPrompt}"`);

  console.log('1. Creating text-to-model task...');
  const genResult = await apiRequest('/generation/text-to-model', 'POST', {
    model: 'P1-20260311',
    face_limit: asset.face_limit,
    texture: true,
    pbr: false,
    prompt: fullPrompt,
    negative_prompt: NEGATIVE_PROMPT,
  });
  const genTask = await pollTask(genResult.task_id, `${asset.id}:text-to-model`);

  const taskMeta = {
    id: asset.id,
    prompt: fullPrompt,
    negative_prompt: NEGATIVE_PROMPT,
    face_limit: asset.face_limit,
    tripoTaskIds: {
      generation: genTask.task_id,
    },
    outputUrls: {
      model: genTask.output?.model_url,
      renderedImage: genTask.output?.rendered_image_url,
    },
    completedAt: new Date().toISOString(),
  };

  fs.mkdirSync('assets-src/tripo', { recursive: true });
  fs.writeFileSync(`assets-src/tripo/${asset.id}.json`, JSON.stringify(taskMeta, null, 2));
  console.log(`Saved metadata to assets-src/tripo/${asset.id}.json`);

  const rawGlb = `assets-src/raw/${asset.id}.glb`;
  const finalGlb = asset.file;
  await downloadFile(genTask.output?.model_url, rawGlb);

  optimizeModel(rawGlb, finalGlb, false, asset.textureSize);

  return taskMeta;
}

function updateManifest() {
  const manifestPath = 'public/models/manifest.json';
  let manifest = { models: {} };
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch {
      manifest = { models: {} };
    }
  }

  for (const asset of ASSETS) {
    if (fs.existsSync(asset.file)) {
      const stat = fs.statSync(asset.file);
      let tripoMeta = {};
      const metaFile = `assets-src/tripo/${asset.id}.json`;
      if (fs.existsSync(metaFile)) {
        try {
          tripoMeta = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
        } catch {}
      }

      manifest.models[asset.id] = {
        file: asset.file,
        bytes: stat.size,
        tripoTaskIds: tripoMeta.tripoTaskIds || {},
        prompt: asset.prompt,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Updated manifest: ${manifestPath}`);
}

async function main() {
  const args = process.argv.slice(2);
  const targetAssetArg = args.find((a) => a.startsWith('--asset='));
  const targetAsset = targetAssetArg ? targetAssetArg.split('=')[1] : null;
  const skipExisting = args.includes('--skip-existing');

  fs.mkdirSync('assets-src/tripo', { recursive: true });
  fs.mkdirSync('assets-src/raw', { recursive: true });
  fs.mkdirSync('public/models', { recursive: true });

  const toProcess = targetAsset ? ASSETS.filter((a) => a.id === targetAsset) : ASSETS;

  if (toProcess.length === 0) {
    console.error(`No asset found matching "${targetAsset}". Available: ${ASSETS.map((a) => a.id).join(', ')}`);
    process.exit(1);
  }

  console.log(`Starting Tripo asset generation for: ${toProcess.map((a) => a.id).join(', ')}`);

  for (const asset of toProcess) {
    if (skipExisting && fs.existsSync(asset.file)) {
      console.log(`Skipping existing ${asset.id} (${asset.file})`);
      continue;
    }

    try {
      if (asset.rig) {
        await generateFighter(asset);
      } else {
        await generateProp(asset);
      }
      updateManifest();
    } catch (err) {
      console.error(`ERROR processing ${asset.id}:`, err);
      // Continue with remaining assets if running --all
      if (targetAsset) throw err;
    }
  }

  updateManifest();
  console.log('\nAll asset processing complete!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
