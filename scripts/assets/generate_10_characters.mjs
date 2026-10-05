import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// 1. Load environment variables (.env.local, .env)
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

const TRIPO_API_KEY = process.env.TRIPO_API_KEY || process.env.VITE_TRIPO_API_KEY;
if (!TRIPO_API_KEY) {
  console.error('ERROR: TRIPO_API_KEY is not set');
  process.exit(1);
}

const BASE_URL = 'https://openapi.tripo3d.ai/v3';
const STYLE_SUFFIX = ', chunky vinyl toy, smooth rounded shapes, simple flat colors, no thin parts, soft matte plastic, Saturday-morning cartoon style, game-ready low poly, centered, plain background';
const NEGATIVE_PROMPT = 'realistic, photoreal, thin parts, spikes, text, logo, multiple objects, base plate, floor, noisy texture, baked harsh shadows';

export const CHARACTERS = [
  // --- TEAM CYAN (5 Fighters) ---
  {
    id: 'char-1-king',
    name: 'Punch Prodigy (Crown King)',
    team: 0,
    costume: 'crown',
    prompt: 'chunky chibi hero vinyl toy, cute round head, big eyes, wearing small golden crown with round gems, blue cyan sports suit, chunky boots, T-pose with arms straight out',
  },
  {
    id: 'char-2-dj',
    name: 'DJ Bounce',
    team: 0,
    costume: 'dj_headphones',
    prompt: 'chunky chibi vinyl toy bean wearing large colorful DJ headphones, glowing neon visor, blue cyan streetwear hoodie, chunky sneakers, T-pose with arms straight out',
  },
  {
    id: 'char-3-ninja',
    name: 'Ninja Bean',
    team: 0,
    costume: 'ninja_headband',
    prompt: 'chunky chibi ninja cat vinyl toy, cute cat ears, red ninja forehead headband, cute whiskers, cyan ninja wraps, shuriken pouch, T-pose with arms straight out',
  },
  {
    id: 'char-4-aviator',
    name: 'Turbo Aviator',
    team: 0,
    costume: 'propeller_hat',
    prompt: 'chunky chibi aviator pilot vinyl toy bean, wearing vintage flight goggles, propeller hat, cyan aviator vest, white scarf, T-pose with arms straight out',
  },
  {
    id: 'char-5-party',
    name: 'Party Popper',
    team: 0,
    costume: 'party_hat',
    prompt: 'chunky chibi festive party bean vinyl toy, wearing tall striped cone party hat with pom-pom, colorful polka-dot bow tie, cyan suit, T-pose with arms straight out',
  },

  // --- TEAM CORAL (5 Fighters) ---
  {
    id: 'char-6-dino',
    name: 'Rex Crush (Dino Kaiju)',
    team: 1,
    costume: 'dino_crest',
    prompt: 'chunky chibi baby dinosaur T-rex vinyl toy, round snout with cute teeth, dorsal back spikes, little tail, coral red and orange colors, T-pose with arms straight out',
  },
  {
    id: 'char-7-bunny',
    name: 'Hopper Mad (Bunny Brawler)',
    team: 1,
    costume: 'bunny_ears',
    prompt: 'chunky chibi brawler bunny vinyl toy, long floppy rabbit ears, cute pink nose, boxing mitts on hands, coral red team jersey, T-pose with arms straight out',
  },
  {
    id: 'char-8-agent',
    name: 'Shady VIP (Cyber Agent)',
    team: 1,
    costume: 'pro_shades',
    prompt: 'chunky chibi secret agent brawler vinyl toy, sleek dark sunglasses, high trenchcoat collar, cool confident smirk, coral boots, T-pose with arms straight out',
  },
  {
    id: 'char-9-viking',
    name: 'Spike Tyrant (Viking Bruiser)',
    team: 1,
    costume: 'dino_crest',
    prompt: 'chunky chibi viking brawler vinyl toy, round iron helmet with cute blunt horns, coral red tunic, spiked wristbands, heavy brawler boots, T-pose with arms straight out',
  },
  {
    id: 'char-10-robot',
    name: 'Cyber Beast (Mecha Robot)',
    team: 1,
    costume: 'pro_shades',
    prompt: 'chunky chibi retro toy robot, cubic head with antenna bolts, glowing pixel eye visor, gauge meter on chest, chunky robotic clippers, coral red metallic accents, T-pose with arms straight out',
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
        await new Promise((r) => setTimeout(r, attempts * 3000));
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
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

async function pollTask(taskId, label = 'task') {
  while (true) {
    await new Promise((r) => setTimeout(r, 2500));
    const task = await apiRequest(`/tasks/${taskId}`, 'GET');
    const { status, progress = 0 } = task;
    process.stdout.write(`\r[${label}] Status: ${status} (${progress}%)   `);

    if (status === 'success') {
      console.log(`\n[${label}] Completed!`);
      return task;
    }
    if (['failed', 'cancelled', 'banned'].includes(status)) {
      console.log('\n');
      throw new Error(`[${label}] Task failed: ${status}`);
    }
  }
}

async function downloadFile(url, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buffer));
  console.log(`Downloaded ${destPath} (${(buffer.byteLength / 1024).toFixed(1)} KB)`);
}

function optimizeModel(inputGlb, outputGlb) {
  fs.mkdirSync(path.dirname(outputGlb), { recursive: true });
  const cmd = `npx -y @gltf-transform/cli optimize "${inputGlb}" "${outputGlb}" --compress meshopt --texture-compress webp --texture-size 512`.trim();
  try {
    execSync(cmd, { stdio: 'pipe' });
    const stat = fs.statSync(outputGlb);
    console.log(`Optimized ${outputGlb}: ${(stat.size / 1024).toFixed(1)} KB`);
  } catch (err) {
    console.warn(`Warning: gltf-transform failed, copying raw GLB instead`);
    fs.copyFileSync(inputGlb, outputGlb);
  }
}

async function main() {
  console.log(`=== Tripo 3D: Generating 10 Awesome Characters for BounceBack ===\n`);
  const outDir = 'public/models/characters';
  const rawDir = 'assets-src/raw/characters';
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(rawDir, { recursive: true });

  const manifest = [];

  // Launch all 10 tasks in batch
  console.log(`Submitting 10 character generation tasks to Tripo API...`);
  const activeTasks = [];

  for (const char of CHARACTERS) {
    const fullPrompt = `${char.prompt}${STYLE_SUFFIX}`;
    console.log(`\n-> Submitting [${char.id}]: "${char.name}"`);
    try {
      const res = await apiRequest('/generation/text-to-model', 'POST', {
        model: 'P1-20260311',
        face_limit: 3500,
        texture: true,
        pbr: false,
        prompt: fullPrompt,
        negative_prompt: NEGATIVE_PROMPT,
      });
      activeTasks.push({ char, taskId: res.task_id });
      console.log(`   Task ID: ${res.task_id} (queued)`);
      // Small 500ms breather between task submissions
      await new Promise((r) => setTimeout(r, 500));
    } catch (e) {
      console.error(`   Failed to submit ${char.id}: ${e.message}`);
    }
  }

  console.log(`\nAll ${activeTasks.length} tasks submitted. Now polling for completions...`);

  for (const { char, taskId } of activeTasks) {
    console.log(`\nWaiting for [${char.id}] (${char.name})...`);
    try {
      const task = await pollTask(taskId, char.id);
      const modelUrl = task.output?.model_url;
      const imageUrl = task.output?.rendered_image_url || task.output?.generated_image_url;

      if (!modelUrl) {
        console.error(`No model URL in output for ${char.id}`);
        continue;
      }

      const rawFile = `${rawDir}/${char.id}.glb`;
      const finalFile = `${outDir}/${char.id}.glb`;

      await downloadFile(modelUrl, rawFile);
      optimizeModel(rawFile, finalFile);

      manifest.push({
        id: char.id,
        name: char.name,
        team: char.team,
        costume: char.costume,
        modelFile: `/models/characters/${char.id}.glb`,
        previewImage: imageUrl,
        taskId,
      });
    } catch (err) {
      console.error(`Error processing ${char.id}: ${err.message}`);
    }
  }

  // Write manifest
  fs.writeFileSync(
    `${outDir}/manifest.json`,
    JSON.stringify({ characters: manifest, generatedAt: new Date().toISOString() }, null, 2)
  );
  console.log(`\nDone! Saved ${manifest.length} characters and manifest to ${outDir}/manifest.json`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
