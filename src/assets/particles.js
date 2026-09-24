/**
 * Atmospheric particle system for Ghibli environment.
 *
 * Cherry blossom petals, dandelion seeds, golden dust motes,
 * and wind streak ribbons. All procedural, zero external files.
 */

const TAU = Math.PI * 2;

/**
 * Create the atmospheric particle system.
 * Returns an object with an `update(time, dt)` method to call each frame.
 */
export function createParticleSystem(THREE, scene) {
  const particles = [];
  const totalCount = 80;

  // Petal geometry (small curved quad)
  const petalGeo = new THREE.PlaneGeometry(0.08, 0.05);
  // Curve vertices slightly
  const pp = petalGeo.attributes.position;
  for (let i = 0; i < pp.count; i++) {
    const y = pp.getY(i);
    pp.setZ(i, Math.abs(y) * 0.3);
  }
  pp.needsUpdate = true;
  petalGeo.computeVertexNormals();

  // Dandelion geometry (tiny sphere with stem)
  const dandGeo = new THREE.SphereGeometry(0.025, 6, 4);

  // Dust mote geometry
  const dustGeo = new THREE.SphereGeometry(0.012, 4, 3);

  // Materials
  const petalMat = new THREE.MeshBasicMaterial({
    color: 0xFFB7C5, transparent: true, opacity: 0.75,
    side: THREE.DoubleSide,
  });
  const dandMat = new THREE.MeshBasicMaterial({
    color: 0xFFFFF0, transparent: true, opacity: 0.7,
  });
  const dustMat = new THREE.MeshBasicMaterial({
    color: 0xFFE8A0, transparent: true, opacity: 0.5,
  });

  const group = new THREE.Group();

  // Wind parameters
  const windX = 0.8, windZ = 0.3;

  for (let i = 0; i < totalCount; i++) {
    const type = i < 32 ? 'petal' : i < 64 ? 'dandelion' : 'dust';
    const geo = type === 'petal' ? petalGeo : type === 'dandelion' ? dandGeo : dustGeo;
    const mat = type === 'petal' ? petalMat.clone() : type === 'dandelion' ? dandMat.clone() : dustMat.clone();

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = false;
    mesh.receiveShadow = false;

    // Random initial position
    mesh.position.set(
      (Math.random() - 0.5) * 30,
      1 + Math.random() * 10,
      (Math.random() - 0.5) * 30
    );

    const particle = {
      mesh,
      type,
      seed: Math.random() * 100,
      tumbleSpeed: 0.5 + Math.random() * 2,
      fallSpeed: type === 'petal' ? 0.15 + Math.random() * 0.1
               : type === 'dandelion' ? 0.05 + Math.random() * 0.05
               : 0.02 + Math.random() * 0.02,
      driftAmp: 0.3 + Math.random() * 0.5,
      baseOpacity: mat.opacity,
    };

    particles.push(particle);
    group.add(mesh);
  }

  scene.add(group);

  // Wind streak ribbons
  const streaks = [];
  const streakMat = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF, transparent: true, opacity: 0, side: THREE.DoubleSide,
  });

  for (let i = 0; i < 3; i++) {
    const width = 6 + Math.random() * 8;
    const height = 0.02;
    const streak = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      streakMat.clone()
    );
    streak.rotation.x = -Math.PI / 2;
    streak.position.set(
      (Math.random() - 0.5) * 20,
      0.15,
      (Math.random() - 0.5) * 20
    );

    const data = {
      mesh: streak,
      speed: 8 + Math.random() * 6,
      timer: Math.random() * 10,
      interval: 5 + Math.random() * 8,
      active: false,
      life: 0,
      maxLife: 1.2,
    };

    streaks.push(data);
    scene.add(streak);
  }

  return {
    update(time, dt) {
      // Update particles
      for (const p of particles) {
        const m = p.mesh;

        // Drift
        m.position.x += (Math.sin(time * 0.5 + p.seed) * p.driftAmp * 0.3 + windX) * dt;
        m.position.z += (Math.cos(time * 0.7 + p.seed * 1.3) * p.driftAmp * 0.2 + windZ) * dt;
        m.position.y -= p.fallSpeed * dt;

        // Tumble rotation
        if (p.type === 'petal') {
          m.rotation.x += dt * p.tumbleSpeed;
          m.rotation.y += dt * p.tumbleSpeed * 0.7;
          m.rotation.z += dt * p.tumbleSpeed * 0.4;
        } else if (p.type === 'dandelion') {
          m.rotation.y += dt * p.tumbleSpeed * 0.3;
        }

        // Respawn if too low or too far
        if (m.position.y < -0.5 || Math.abs(m.position.x) > 20 || Math.abs(m.position.z) > 20) {
          m.position.set(
            (Math.random() - 0.5) * 30 - 5, // bias towards wind source
            4 + Math.random() * 8,
            (Math.random() - 0.5) * 30
          );
        }

        // Fade based on height (lower = more opaque for catching light)
        const heightFade = clamp01(m.position.y / 8);
        m.material.opacity = p.baseOpacity * (0.5 + heightFade * 0.5);
      }

      // Update wind streaks
      for (const s of streaks) {
        s.timer += dt;

        if (!s.active && s.timer > s.interval) {
          s.active = true;
          s.life = 0;
          s.timer = 0;
          s.mesh.position.x = -15;
          s.mesh.position.z = (Math.random() - 0.5) * 16;
        }

        if (s.active) {
          s.life += dt;
          s.mesh.position.x += s.speed * dt;

          // Fade in and out
          const t = s.life / s.maxLife;
          const opacity = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1;
          s.mesh.material.opacity = opacity * 0.2;

          if (s.life > s.maxLife) {
            s.active = false;
            s.mesh.material.opacity = 0;
            s.interval = 4 + Math.random() * 8;
          }
        }
      }
    }
  };
}

function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
