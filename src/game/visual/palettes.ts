import * as THREE from "three";

export interface RoundPalette {
  roundNumber: number;
  kadoId: string;
  title: string;
  subtitle: string;
  themeTitle: string;
  primary: string;
  accent: string;
  primaryHex: number;
  accentHex: number;
  fogColor: number;
  clearColor: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  sunColor: number;
  sunIntensity: number;
  fillColor: number;
  rimColor: number;
  cloudColor: number;
  cloudEmissive: number;
  cloudEmissiveIntensity: number;
}

export const ROUND_PALETTES: Record<number, RoundPalette> = {
  1: {
    roundNumber: 1,
    kadoId: "kado_1",
    title: "KADO #1: KAMAR MASA KECIL",
    subtitle: "TOYBOX MORNING",
    themeTitle: "Bedroom Sunrise",
    primary: "#8EC5FF",
    accent: "#FFF4D6",
    primaryHex: 0x8ec5ff,
    accentHex: 0xfff4d6,
    fogColor: 0x8ec5ff,
    clearColor: 0x8ec5ff,
    hemiSky: 0x8ec5ff,
    hemiGround: 0xfff4d6,
    hemiIntensity: 1.15,
    sunColor: 0xfffbf0,
    sunIntensity: 1.85,
    fillColor: 0xbae6fd,
    rimColor: 0xffd166,
    cloudColor: 0xffffff,
    cloudEmissive: 0xfff4d6,
    cloudEmissiveIntensity: 0.25,
  },
  2: {
    roundNumber: 2,
    kadoId: "kado_2",
    title: "KADO #2: KOTA MAINAN",
    subtitle: "CARDBOARD CITY EXPRESS",
    themeTitle: "Toy City Sunset",
    primary: "#E63946",
    accent: "#FFD60A",
    primaryHex: 0xe63946,
    accentHex: 0xffd60a,
    fogColor: 0xf4a261,
    clearColor: 0xe63946,
    hemiSky: 0xffb703,
    hemiGround: 0xe63946,
    hemiIntensity: 1.1,
    sunColor: 0xffd60a,
    sunIntensity: 1.9,
    fillColor: 0xfb8500,
    rimColor: 0xffffff,
    cloudColor: 0x9b2226,
    cloudEmissive: 0xffd60a,
    cloudEmissiveIntensity: 0.35,
  },
  3: {
    roundNumber: 3,
    kadoId: "kado_3",
    title: "KADO #3: LAYANGAN SORE",
    subtitle: "GOLDEN DRIFT AFTERNOON",
    themeTitle: "Backyard Kite Skies",
    primary: "#FF9F43",
    accent: "#6BCB77",
    primaryHex: 0xff9f43,
    accentHex: 0x6bcb77,
    fogColor: 0xff9f43,
    clearColor: 0xf3722c,
    hemiSky: 0xffb085,
    hemiGround: 0x6bcb77,
    hemiIntensity: 1.05,
    sunColor: 0xffeaa7,
    sunIntensity: 1.8,
    fillColor: 0x43aa8b,
    rimColor: 0xf9c74f,
    cloudColor: 0x2d6a4f,
    cloudEmissive: 0xff9f43,
    cloudEmissiveIntensity: 0.3,
  },
  4: {
    roundNumber: 4,
    kadoId: "kado_4",
    title: "KADO #4: PASAR MALAM",
    subtitle: "CARNIVAL WHEEL SPECTACLE",
    themeTitle: "Night Carnival Twilight",
    primary: "#E0218A",
    accent: "#FFC93C",
    primaryHex: 0xe0218a,
    accentHex: 0xffc93c,
    fogColor: 0x3b185f,
    clearColor: 0x2a0845,
    hemiSky: 0xe0218a,
    hemiGround: 0x3b185f,
    hemiIntensity: 0.95,
    sunColor: 0xffc93c,
    sunIntensity: 1.7,
    fillColor: 0x06d6a0,
    rimColor: 0xff007f,
    cloudColor: 0x1a0826,
    cloudEmissive: 0xe0218a,
    cloudEmissiveIntensity: 0.4,
  },
  5: {
    roundNumber: 5,
    kadoId: "kado_5",
    title: "KADO #5: ATAP PENUH BINTANG",
    subtitle: "MIDNIGHT ROOFTOP GIFT",
    themeTitle: "Rooftop Starlight Climax",
    primary: "#1B1F4B",
    accent: "#FFD166",
    primaryHex: 0x1b1f4b,
    accentHex: 0xffd166,
    fogColor: 0x1b1f4b,
    clearColor: 0x0f122c,
    hemiSky: 0x3b3b98,
    hemiGround: 0x1b1f4b,
    hemiIntensity: 0.85,
    sunColor: 0xffd166,
    sunIntensity: 1.65,
    fillColor: 0x48dbfb,
    rimColor: 0xf368e0,
    cloudColor: 0x0b0c1e,
    cloudEmissive: 0xffd166,
    cloudEmissiveIntensity: 0.28,
  },
};

export function getRoundPalette(roundNumber: number): RoundPalette {
  return ROUND_PALETTES[roundNumber] || ROUND_PALETTES[1];
}

/**
 * Apply the 5-round color scheme dynamically to the Three.js scene, renderer,
 * and key lights (HemisphereLight, DirectionalLights, Scene Fog).
 */
export function applyRoundPalette(
  roundNumber: number,
  scene: THREE.Scene,
  renderer?: THREE.WebGLRenderer,
  hemiLight?: THREE.HemisphereLight | null,
  sunLight?: THREE.DirectionalLight | null,
  fillLight?: THREE.DirectionalLight | null,
  rimLight?: THREE.DirectionalLight | null
) {
  const p = getRoundPalette(roundNumber);

  // Fog
  if (scene.fog && scene.fog instanceof THREE.Fog) {
    scene.fog.color.setHex(p.fogColor);
  }

  // Renderer clear color
  if (renderer) {
    renderer.setClearColor(p.clearColor, 1);
  }

  // Hemisphere Light (sky & ground)
  if (hemiLight) {
    hemiLight.color.setHex(p.hemiSky);
    hemiLight.groundColor.setHex(p.hemiGround);
    hemiLight.intensity = p.hemiIntensity;
  }

  // Main Sun Directional Light
  if (sunLight) {
    sunLight.color.setHex(p.sunColor);
    sunLight.intensity = p.sunIntensity;
  }

  // Fill Light
  if (fillLight) {
    fillLight.color.setHex(p.fillColor);
  }

  // Rim Light
  if (rimLight) {
    rimLight.color.setHex(p.rimColor);
  }

  // Fallback: if lights weren't provided explicitly, search top-level scene children
  if (!hemiLight || !sunLight) {
    scene.traverse((child) => {
      if (child instanceof THREE.HemisphereLight && !hemiLight) {
        child.color.setHex(p.hemiSky);
        child.groundColor.setHex(p.hemiGround);
        child.intensity = p.hemiIntensity;
      } else if (child instanceof THREE.DirectionalLight && child.castShadow && !sunLight) {
        child.color.setHex(p.sunColor);
        child.intensity = p.sunIntensity;
      }
    });
  }
}
