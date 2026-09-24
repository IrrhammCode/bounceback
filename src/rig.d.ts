import type * as THREE from "three";

export interface RigOptions {
  hour?: number;
  azimuth?: number;
  elevation?: number;
  sunrise?: number;
  sunset?: number;
  maxElevation?: number;
  tier?: "high" | "phone" | "auto" | Record<string, unknown>;
  camera?: THREE.Camera | null;
  exposure?: number;
  sunIntensity?: number;
  sunColor?: number;
  envMap?: THREE.Texture | null;
  fill?: number;
  fillChroma?: number;
  bounce?: number;
  bounceUnder?: number;
  bounceSide?: number;
  bounceFlat?: number;
  envIntensity?: number;
  envDiffuse?: number;
  sky?: boolean;
  fog?: boolean;
  fogStart?: number;
  fogDensity?: number;
  wrap?: number;
  toe?: number;
  capEnv?: number;
  post?: boolean;
  bloom?: boolean;
  bloomThreshold?: number;
  bloomStrength?: number;
  bloomRadius?: number;
  shadows?: boolean;
  shadowDist?: number;
  shadowMap?: number;
  cascades?: number;
  background?: boolean;
  refreshEvery?: number;
  CSM?: unknown;
}

export interface Rig {
  hemi: THREE.HemisphereLight;
  fog: THREE.Fog;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  readonly sun: THREE.DirectionalLight;
  readonly csm: unknown;
  readonly sunDir: THREE.Vector3;
  readonly elevation: number;
  readonly environment: THREE.Texture | null;
  readonly post: unknown;
  tier: Record<string, unknown>;
  ready: Promise<unknown>;
  update(camera: THREE.Camera, dt?: number): void;
  render(camera: THREE.Camera, dt?: number): void;
  setTime(next: { hour?: number; azimuth?: number; elevation?: number }): { hour: number; azimuth: number; elevation: number };
  refresh(root?: THREE.Object3D): number;
  setupMaterial(m: THREE.Material): boolean;
  resize(w: number, h: number): void;
  dispose(): void;
}

export function createRig(THREE: typeof import("three"), renderer: THREE.WebGLRenderer, scene: THREE.Scene, opts?: RigOptions): Rig;
export function sunPosition(THREE: typeof import("three"), opts?: RigOptions): { elevation: number; azimuth: number; direction: THREE.Vector3 };
export function detectTier(): "high" | "phone";
export const TIERS: Record<string, Record<string, unknown>>;
export const ATMOS_KEYS: unknown[];
