import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

for (const envFile of ['.env.local', '.env']) {
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
      const [k, ...v] = line.trim().split('=');
      if (k && v.length && !process.env[k]) process.env[k] = v.join('=');
    }
  }
}

const key = process.env.TRIPO_API_KEY;
if (!key) {
  console.error('No TRIPO_API_KEY');
  process.exit(1);
}

const CHAR_TASKS = [
  { id: 'char-1-king', name: 'Punch Prodigy (Crown King)', team: 0, costume: 'crown', tid: '028bb117-1ddb-439a-a52b-e2d6ff28d309' },
  { id: 'char-2-dj', name: 'DJ Bounce', team: 0, costume: 'dj_headphones', tid: '86313d36-5dde-4e21-b4b0-825331fbe8e1' },
  { id: 'char-3-ninja', name: 'Ninja Bean', team: 0, costume: 'ninja_headband', tid: '7385c04a-76b3-4d6a-9dbd-ba27ca1252a9' },
  { id: 'char-4-aviator', name: 'Turbo Aviator', team: 0, costume: 'propeller_hat', tid: 'ecb7f603-8020-4e63-b364-0938ba587566' },
  { id: 'char-5-party', name: 'Party Popper', team: 0, costume: 'party_hat', tid: 'd0bad002-d6d7-4848-a856-391aa07ad83e' },
  { id: 'char-6-dino', name: 'Rex Crush (Dino Kaiju)', team: 1, costume: 'dino_crest', tid: '9702e37d-bf3c-4d26-856b-792035f4f850' },
  { id: 'char-7-bunny', name: 'Hopper Mad (Bunny Brawler)', team: 1, costume: 'bunny_ears', tid: '03975cc3-fb16-4d13-9eb4-cee49fa9188d' },
  { id: 'char-8-agent', name: 'Shady VIP (Cyber Agent)', team: 1, costume: 'pro_shades', tid: '89d24ed9-065d-4c2d-a5d7-07d9581fbaee' },
  { id: 'char-9-viking', name: 'Spike Tyrant (Viking Bruiser)', team: 1, costume: 'dino_crest', tid: '2782d6fc-825f-431e-a908-0ca5d7bcd515' },
  { id: 'char-10-robot', name: 'Cyber Beast (Mecha Robot)', team: 1, costume: 'pro_shades', tid: 'b625cbca-6de2-450a-b3bd-7b4e7b507f14' },
];

const outDir = 'public/models/characters';
const rawDir = 'assets-src/raw/characters';
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(rawDir, { recursive: true });

async function poll(t) {
  while (true) {
    const res = await fetch(`https://openapi.tripo3d.ai/v3/tasks/${t.tid}`, {
      headers: { Authorization: `Bearer ${key}` }
    });
    const d = await res.json();
    const task = d.data;
    if (task.status === 'success') {
      return task;
    }
    if (['failed', 'cancelled'].includes(task.status)) {
      throw new Error(`${t.id} failed`);
    }
    process.stdout.write(`\r[${t.id}] ${task.status} (${task.progress || 0}%) `);
    await new Promise(r => setTimeout(r, 2000));
  }
}

async function main() {
  console.log('Downloading & Optimizing 10 Tripo Characters...\n');
  const manifest = [];

  for (const t of CHAR_TASKS) {
    const rawFile = `${rawDir}/${t.id}.glb`;
    const finalFile = `${outDir}/${t.id}.glb`;

    console.log(`\nWaiting for ${t.id} (${t.name})...`);
    const task = await poll(t);
    const modelUrl = task.output?.model_url;
    const previewUrl = task.output?.rendered_image_url || task.output?.generated_image_url;

    if (!fs.existsSync(rawFile)) {
      console.log(`Downloading ${t.id}...`);
      const res = await fetch(modelUrl);
      const buf = await res.arrayBuffer();
      fs.writeFileSync(rawFile, Buffer.from(buf));
    }

    if (!fs.existsSync(finalFile)) {
      console.log(`Optimizing ${t.id}...`);
      try {
        execSync(`npx -y @gltf-transform/cli optimize "${rawFile}" "${finalFile}" --compress meshopt --texture-compress webp --texture-size 512`, { stdio: 'pipe' });
      } catch {
        fs.copyFileSync(rawFile, finalFile);
      }
    }

    manifest.push({
      id: t.id,
      name: t.name,
      team: t.team,
      costume: t.costume,
      modelPath: `/models/characters/${t.id}.glb`,
      previewImage: previewUrl,
      taskId: t.tid,
    });
  }

  fs.writeFileSync(`${outDir}/manifest.json`, JSON.stringify({ characters: manifest, count: manifest.length }, null, 2));
  console.log(`\nAll 10 Tripo characters ready at ${outDir}/manifest.json!`);
}

main().catch(console.error);
