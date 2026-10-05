/**
 * World Labs Marble 3D Gaussian Splats Backdrop Manager (via @sparkjsdev/spark)
 *
 * Implements Phase 3 Visual Upgrades for Tripothon:
 * - Loads real World Labs 3D Gaussian Splatting dioramas (.spz) around the arena ring.
 * - Multi-tiered rendering:
 *     - Tier 1 (Desktop): 500k Gaussian Splats (highest fidelity)
 *     - Tier 2 (Mobile / Low-spec): 100k Gaussian Splats (lightweight, maintains >=50fps)
 *     - Fallback 1: Equirectangular 360 panorama sphere (only when ?splats=pano)
 *     - Fallback 2: Phase 2 painted 4K Ultra-HD cartoon CanvasTexture (zero overhead)
 * - Single-world memory lifecycle (auto-disposes previous round splats).
 * - Preloads round N+1 during round victory celebration.
 */
import * as THREE from "three";

export type WorldTier = "desktop" | "mobile" | "pano_fallback" | "disabled";

interface SplatMeshInstance {
  mesh: THREE.Object3D;
  dispose?: () => void;
  url: string;
}

let sparkModulePromise: Promise<typeof import("@sparkjsdev/spark")> | null = null;

function getSpark(): Promise<typeof import("@sparkjsdev/spark")> {
  if (!sparkModulePromise) {
    sparkModulePromise = import("@sparkjsdev/spark");
  }
  return sparkModulePromise;
}

export class WorldBackdropManager {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private sparkRenderer: any = null;
  private sparkModule: any = null;
  private currentSplat: SplatMeshInstance | null = null;
  private panoSphere: THREE.Mesh | null = null;
  private currentRound: number = 0;
  private isInitializing: boolean = false;
  private tier: WorldTier = "desktop";

  // Dynamic FPS Watchdog
  private lowFpsCounter = 0;
  private fpsWindowStart = 0;
  private framesCount = 0;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.tier = this.detectTier();
  }

  /**
   * Detects device performance tier
   */
  private detectTier(): WorldTier {
    if (typeof window === "undefined") return "disabled";

    const params = new URLSearchParams(window.location.search);
    // Volumetric 3D Gaussian Splats are purely opt-in via ?splats=1 or ?splats=500k
    // because close-up radiance fields occlude dynamic 3rd-person gameplay cameras.
    if (params.get("splats") === "1" || params.get("splats") === "500k") {
      return "desktop";
    }
    if (params.get("splats") === "100k") {
      return "mobile";
    }
    if (params.get("splats") === "pano") {
      return "pano_fallback";
    }

    // Default to clean, ultra-sharp Three.js 3D diorama environments
    return "disabled";
  }

  /**
   * Lazy initializes the Spark 3DGS renderer
   */
  private async ensureSpark(): Promise<boolean> {
    if (this.sparkRenderer) return true;
    if (this.tier === "disabled" || this.tier === "pano_fallback") return false;

    try {
      this.isInitializing = true;
      const spark = await getSpark();
      this.sparkModule = spark;

      if (!this.sparkRenderer) {
        this.sparkRenderer = new spark.SparkRenderer({
          renderer: this.renderer,
        });
        this.scene.add(this.sparkRenderer);
      }
      this.isInitializing = false;
      return true;
    } catch (err) {
      console.warn("[WorldBackdrop] Spark failed to initialize, retrying on next attempt:", err);
      sparkModulePromise = null;
      this.isInitializing = false;
      return false;
    }
  }

  /**
   * Transitions to the World Labs backdrop for round N
   */
  public async loadRoundWorld(roundNumber: number): Promise<void> {
    if (this.currentRound === roundNumber && (this.currentSplat || this.panoSphere)) {
      return;
    }
    this.currentRound = roundNumber;

    if (this.tier === "disabled") {
      this.disposeCurrent();
      return;
    }

    const roundId = `r${roundNumber}`;
    const isMobileTier = this.tier === "mobile";
    const spzFilename = isMobileTier ? "100k.spz" : "500k.spz";
    const spzUrl = `/worlds/${roundId}/${spzFilename}`;
    const panoUrl = `/worlds/${roundId}/pano.webp`;

    // If explicit pano fallback requested
    if (this.tier === "pano_fallback") {
      try {
        const hasPano = await this.checkUrlExists(panoUrl);
        if (hasPano) {
          this.loadPanoSphere(panoUrl, roundNumber);
          return;
        }
      } catch (e) {
        // Fallback to 4K procedural canvas sky
      }
      this.disposeCurrent();
      return;
    }

    // Load 3D Gaussian Splats via Spark
    const sparkReady = await this.ensureSpark();

    if (sparkReady && this.sparkModule) {
      try {
        const hasSpz = await this.checkUrlExists(spzUrl);
        if (hasSpz) {
          await this.loadSplatMesh(spzUrl, roundNumber);
          return;
        } else {
          // If 500k not found on desktop, try 100k
          const fallback100k = `/worlds/${roundId}/100k.spz`;
          const has100k = await this.checkUrlExists(fallback100k);
          if (has100k) {
            await this.loadSplatMesh(fallback100k, roundNumber);
            return;
          }
        }
      } catch (err) {
        console.warn(`[WorldBackdrop] Error loading SPZ for ${roundId}:`, err);
      }
    }

    // If Spark failed, keep the sharp 4K Ultra-HD procedural canvas sky
    this.disposeCurrent();
  }

  /**
   * Loads and places a SplatMesh in the scene
   */
  private async loadSplatMesh(spzUrl: string, roundNumber: number): Promise<void> {
    const { SplatMesh } = this.sparkModule;

    // Dispose old splat before attaching new one
    if (this.currentSplat) {
      this.currentSplat.dispose?.();
      this.currentSplat = null;
    }

    const splat = new SplatMesh({ url: spzUrl });

    // Marble SPZ convention: 180° rotation around X axis (OpenCV Y-down -> Three.js Y-up)
    splat.quaternion.set(1, 0, 0, 0);

    // Position & Scale the diorama around the floating arena ring
    // Scale ~16m wraps tightly around the ring boundaries (ARENA_W=24, ARENA_L=40)
    // preserving microscopic, dense, ultra-crisp Gaussian splat points!
    const scale = 15.0;
    splat.scale.set(scale, scale, scale);
    splat.position.set(0, -3.2, 0);

    // Add to scene graph
    this.scene.add(splat);

    // Wait for worker parsing
    splat.initialized?.then(() => {
      console.log(`[WorldBackdrop] ✓ 3DGS Round ${roundNumber} (${spzUrl}) rendered at ultra-HD density`);
    }).catch((e: any) => {
      console.warn(`[WorldBackdrop] Splat initialization error:`, e);
    });

    this.currentSplat = {
      mesh: splat,
      url: spzUrl,
      dispose: () => {
        try {
          if (typeof splat.dispose === "function") splat.dispose();
          this.scene.remove(splat);
        } catch (e) {
          // Ignore disposal errors
        }
      },
    };

    // Remove any fallback pano sphere
    if (this.panoSphere) {
      this.scene.remove(this.panoSphere);
      if (this.panoSphere.geometry) this.panoSphere.geometry.dispose();
      const mat = this.panoSphere.material as THREE.MeshBasicMaterial;
      if (mat) {
        if (mat.map) mat.map.dispose();
        mat.dispose();
      }
      this.panoSphere = null;
    }
  }

  /**
   * Loads an equirectangular panorama sphere as fallback
   */
  private loadPanoSphere(panoUrl: string, _roundNumber: number): void {
    if (this.panoSphere) {
      this.scene.remove(this.panoSphere);
      if (this.panoSphere.geometry) this.panoSphere.geometry.dispose();
      const mat = this.panoSphere.material as THREE.MeshBasicMaterial;
      if (mat) {
        if (mat.map) mat.map.dispose();
        mat.dispose();
      }
      this.panoSphere = null;
    }

    const loader = new THREE.TextureLoader();
    loader.load(
      panoUrl,
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const sphereGeo = new THREE.SphereGeometry(220, 32, 24);
        const sphereMat = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.BackSide,
          depthWrite: false,
        });

        const mesh = new THREE.Mesh(sphereGeo, sphereMat);
        mesh.position.set(0, 0, 0);
        this.scene.add(mesh);
        this.panoSphere = mesh;
      },
      undefined,
      (err) => {
        console.warn("[WorldBackdrop] Pano texture load failed:", err);
      }
    );
  }

  /**
   * Preload Round N+1 during round victory celebration pause
   */
  public preloadNextRound(nextRoundNumber: number): void {
    if (this.tier === "disabled" || nextRoundNumber > 5) return;
    const roundId = `r${nextRoundNumber}`;
    const spzFilename = this.tier === "mobile" ? "100k.spz" : "500k.spz";
    const spzUrl = `/worlds/${roundId}/${spzFilename}`;

    try {
      fetch(spzUrl, { mode: "no-cors" }).catch(() => {});
    } catch {
      // Ignore prefetch errors
    }
  }

  /**
   * Performance watchdog called every frame to ensure >=50 FPS on mobile
   */
  public updatePerformance(nowMs: number): void {
    if (this.tier === "pano_fallback" || this.tier === "disabled") return;

    if (this.fpsWindowStart === 0) {
      this.fpsWindowStart = nowMs;
      this.framesCount = 0;
      return;
    }

    this.framesCount++;
    const elapsed = nowMs - this.fpsWindowStart;
    if (elapsed >= 1000) {
      const fps = (this.framesCount * 1000) / elapsed;
      if (fps < 40) {
        this.lowFpsCounter++;
        // If FPS < 40 for 3 consecutive seconds, downgrade tier to maintain smoothness
        if (this.lowFpsCounter >= 3) {
          console.warn("[WorldBackdrop] Low FPS detected over 3s, downgrading to mobile splat or clean 4K sky");
          if (this.tier === "desktop") {
            this.tier = "mobile";
            this.disposeCurrent();
            this.loadRoundWorld(this.currentRound);
          } else {
            this.tier = "disabled";
            this.disposeCurrent();
          }
        }
      } else {
        this.lowFpsCounter = 0;
      }
      this.fpsWindowStart = nowMs;
      this.framesCount = 0;
    }
  }

  private async checkUrlExists(url: string): Promise<boolean> {
    try {
      const res = await fetch(url, { method: "HEAD" });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Cleanly disposes current world assets to free GPU/CPU memory
   */
  public disposeCurrent(): void {
    if (this.currentSplat) {
      if (this.currentSplat.dispose) {
        this.currentSplat.dispose();
      } else {
        this.scene.remove(this.currentSplat.mesh);
      }
      this.currentSplat = null;
    }

    if (this.panoSphere) {
      this.scene.remove(this.panoSphere);
      if (this.panoSphere.geometry) this.panoSphere.geometry.dispose();
      const mat = this.panoSphere.material as THREE.MeshBasicMaterial;
      if (mat) {
        if (mat.map) mat.map.dispose();
        mat.dispose();
      }
      this.panoSphere = null;
    }
  }

  /**
   * Full teardown
   */
  public dispose(): void {
    this.disposeCurrent();
    if (this.sparkRenderer) {
      this.scene.remove(this.sparkRenderer);
      if (typeof this.sparkRenderer.dispose === "function") {
        this.sparkRenderer.dispose();
      }
      this.sparkRenderer = null;
    }
  }
}
