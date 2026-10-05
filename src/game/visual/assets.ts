import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

let loaderInstance: GLTFLoader | null = null;
const gltfCache = new Map<string, GLTF>();

export function getGLTFLoader(): GLTFLoader {
  if (!loaderInstance) {
    loaderInstance = new GLTFLoader();
    loaderInstance.setMeshoptDecoder(MeshoptDecoder);
  }
  return loaderInstance;
}

export const MODEL_PATHS: Record<string, string> = {
  fighter: '/models/fighter.glb',
  'acc-bow': '/models/acc-bow.glb',
  'acc-partyhat': '/models/acc-partyhat.glb',
  'acc-crown': '/models/acc-crown.glb',
  bumper: '/models/bumper.glb',
  'mystery-gift': '/models/mystery-gift.glb',
  'host-gift': '/models/host-gift.glb',
  trophy: '/models/trophy.glb',
};

/**
 * Checks URL query params for ?fighters=legacy
 */
export function isLegacyFightersForced(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('fighters') === 'legacy';
}

/**
 * Loads a GLTF with an 8-second timeout guard.
 */
export async function loadGLTF(url: string, timeoutMs = 8000): Promise<GLTF> {
  const loader = getGLTFLoader();

  const loadPromise = new Promise<GLTF>((resolve, reject) => {
    loader.load(
      url,
      (gltf) => resolve(gltf),
      undefined,
      (err) => reject(err)
    );
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Timeout loading GLTF from ${url} (${timeoutMs}ms)`));
    }, timeoutMs);
  });

  return Promise.race([loadPromise, timeoutPromise]);
}

export interface PreloadResult {
  success: boolean;
  loaded: Record<string, boolean>;
}

/**
 * Preload all model assets behind loading screen with 8s timeout.
 */
export async function preloadGameAssets(
  onProgress?: (progress: number) => void
): Promise<PreloadResult> {
  if (isLegacyFightersForced()) {
    console.log('[Assets] ?fighters=legacy detected: skipping Tripo 3D models');
    return { success: false, loaded: {} };
  }

  const entries = Object.entries(MODEL_PATHS);
  const loaded: Record<string, boolean> = {};
  let completed = 0;

  const promises = entries.map(async ([key, url]) => {
    try {
      const gltf = await loadGLTF(url, 8000);
      gltfCache.set(key, gltf);
      loaded[key] = true;
      console.log(`[Assets] Loaded: ${key} (${url})`);
    } catch (err) {
      console.warn(`[Assets] Could not load ${key} (${url}):`, (err as Error).message);
      loaded[key] = false;
    } finally {
      completed++;
      if (onProgress) {
        onProgress(Math.floor((completed / entries.length) * 100));
      }
    }
  });

  await Promise.all(promises);

  const fighterLoaded = !!loaded.fighter;
  return {
    success: fighterLoaded,
    loaded,
  };
}

export function getLoadedGLTF(id: string): GLTF | null {
  return gltfCache.get(id) || null;
}

export function hasLoadedFighter(): boolean {
  return !isLegacyFightersForced() && gltfCache.has('fighter');
}
