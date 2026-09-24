/**
 * Volumetric god rays and anamorphic lens flare for Ghibli environment.
 *
 * God rays: translucent light cones through canopy breaks.
 * Lens flare: corona, horizontal streak, and chromatic halo ghosts.
 * All procedural, zero external files.
 */

const TAU = Math.PI * 2;

/**
 * Create god rays and lens flare.
 * Returns an object with an `update(time, dt)` method.
 */
export function createGodRays(THREE, scene) {
  const group = new THREE.Group();

  // ─────── God Ray Cones ───────
  const rayCones = [];
  const rayMat = new THREE.MeshBasicMaterial({
    color: 0xFFF8E0,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  // Position rays through canopy gaps
  const rayConfigs = [
    { x: -8, z: -8, rot: 0.3, scale: 1.0 },
    { x: -5, z: -10, rot: -0.2, scale: 0.8 },
    { x: 3, z: -11, rot: 0.1, scale: 1.2 },
    { x: 8, z: -9, rot: -0.15, scale: 0.9 },
    { x: 10, z: -4, rot: 0.25, scale: 0.7 },
    { x: -10, z: 4, rot: -0.1, scale: 0.85 },
  ];

  rayConfigs.forEach(cfg => {
    const cone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 3.5 * cfg.scale, 10, 8, 1, true),
      rayMat.clone()
    );
    cone.position.set(cfg.x, 6, cfg.z);
    cone.rotation.x = -0.4 + cfg.rot;
    cone.rotation.z = cfg.rot * 0.5;
    cone.castShadow = false;
    cone.receiveShadow = false;

    rayCones.push({ mesh: cone, baseOpacity: 0.08, seed: Math.random() * 10 });
    group.add(cone);
  });

  // ─────── Lens Flare Rig ───────
  // Sun position (matching rig hour: 16, azimuth: 250)
  const sunDir = new THREE.Vector3(35, 55, 25).normalize();

  // Corona (central blaze)
  const coronaMat = new THREE.MeshBasicMaterial({
    color: 0xFFF8E7,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const corona = new THREE.Mesh(new THREE.CircleGeometry(3, 16), coronaMat);
  corona.position.copy(sunDir.clone().multiplyScalar(80));
  corona.lookAt(0, 0, 0);
  group.add(corona);

  // Anamorphic horizontal streak
  const streakMat = new THREE.MeshBasicMaterial({
    color: 0x90D8FF,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const streak = new THREE.Mesh(new THREE.PlaneGeometry(25, 0.3), streakMat);
  streak.position.copy(corona.position);
  streak.lookAt(0, 0, 0);
  group.add(streak);

  // Chromatic halo ghosts
  const ghostColors = [0xFF8888, 0x88FF88, 0x8888FF];
  const ghosts = [];
  ghostColors.forEach((color, i) => {
    const ghostMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const ghost = new THREE.Mesh(
      new THREE.RingGeometry(0.8 + i * 0.5, 1.2 + i * 0.5, 16),
      ghostMat
    );
    const t = 0.3 + i * 0.25; // position along sun-to-center axis
    ghost.position.copy(sunDir.clone().multiplyScalar(80 * (1 - t * 2)));
    ghost.lookAt(0, 0, 0);
    ghosts.push({ mesh: ghost, mat: ghostMat });
    group.add(ghost);
  });

  scene.add(group);

  return {
    update(time, dt) {
      // Animate god ray opacity (dust motes passing through)
      rayCones.forEach(ray => {
        const pulse = Math.sin(time * 0.8 + ray.seed) * 0.03;
        const flicker = Math.sin(time * 3.2 + ray.seed * 2) * 0.01;
        ray.mesh.material.opacity = Math.max(0.02, ray.baseOpacity + pulse + flicker);
      });

      // Animate corona pulse
      coronaMat.opacity = 0.5 + Math.sin(time * 0.6) * 0.1;

      // Animate streak
      streakMat.opacity = 0.15 + Math.sin(time * 0.9 + 1) * 0.05;

      // Animate ghosts drift
      ghosts.forEach((g, i) => {
        g.mat.opacity = 0.04 + Math.sin(time * 0.5 + i * 1.5) * 0.02;
      });
    }
  };
}
