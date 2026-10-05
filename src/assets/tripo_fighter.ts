import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { makeToon, addOutline } from '../game/visual/toon.js';
import { getLoadedGLTF } from '../game/visual/assets.js';

export interface TripoFighterOptions {
  team: number;
  isPlayer: boolean;
  number?: number;
  costume?: string;
  fighterIndex?: number;
}

interface BoneMapping {
  bone: THREE.Bone;
  proxy: THREE.Object3D;
  restQuat: THREE.Quaternion;
  restPos: THREE.Vector3;
  isRightArm?: boolean;
}

export const CHAR_KEYS = [
  'char-1-king',   // 0: Cyan Player (You)
  'char-2-dj',     // 1: Cyan DJ (DJ Bounce)
  'char-3-ninja',  // 2: Cyan Ninja (Ninja Bean)
  'char-4-aviator',// 3: Cyan Turbo (Turbo Copter)
  'char-5-party',  // 4: Cyan Popper (Party Popper)
  'char-6-dino',   // 5: Coral Rex (Rex Crush)
  'char-7-bunny',  // 6: Coral Hopper (Hopper Mad)
  'char-8-agent',  // 7: Coral Shady (Shady VIP)
  'char-9-viking', // 8: Coral Spike (Spike Tyrant)
  'char-10-robot', // 9: Coral Cyber (Cyber Beast)
];

function findBone(root: THREE.Object3D, searchName: string): THREE.Bone | null {
  const target = searchName.toLowerCase().replace(/[^a-z0-9]/g, '');
  let match: THREE.Bone | null = null;

  root.traverse((node) => {
    if (!match && (node as THREE.Bone).isBone) {
      const nodeName = node.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (nodeName === target || nodeName.endsWith(target)) {
        match = node as THREE.Bone;
      }
    }
  });

  return match;
}

/**
 * Creates a Tripo vinyl chibi fighter with proxy Object3Ds that conform 100%
 * to the userData contract expected by engine.ts.
 *
 * When a custom Tripo 3D model is loaded for this fighter index, the FULL 3D
 * TRIPO CHARACTER BODY is rendered directly with toon materials and cel-shading!
 */
export function createTripoFighter(
  _THREE: typeof THREE,
  fighterGltf: GLTF,
  opts: TripoFighterOptions
): THREE.Group {
  const group = new THREE.Group();
  const teamColorHex = opts.team === 0 ? 0x27e5ff : 0xff5268;

  // 1. Check if the FULL custom Tripo 3D character model is available
  let fullTripoGltf: GLTF | null = null;
  if (typeof opts.fighterIndex === 'number' && opts.fighterIndex >= 0 && opts.fighterIndex < CHAR_KEYS.length) {
    fullTripoGltf = getLoadedGLTF(CHAR_KEYS[opts.fighterIndex]);
  }

  // 2. Clone skinned dummy mesh for Mixamo skeleton calculations
  const clonedScene = SkeletonUtils.clone(fighterGltf.scene) as THREE.Group;

  let sharedToonMat: THREE.MeshToonMaterial | null = null;
  clonedScene.traverse((node) => {
    if ((node as THREE.Mesh).isMesh) {
      const mesh = node as THREE.Mesh;
      const origMat = mesh.material as THREE.Material & { map?: THREE.Texture | null };
      if (!sharedToonMat) {
        sharedToonMat = makeToon({
          map: origMat?.map || null,
          teamColor: teamColorHex,
          isTeamMasked: true,
        });
      }
      mesh.material = sharedToonMat;
    }
  });

  // 3. Mount Full Tripo Character Body if loaded!
  let fullTripoBody: THREE.Group | null = null;
  if (fullTripoGltf?.scene) {
    fullTripoBody = SkeletonUtils.clone(fullTripoGltf.scene) as THREE.Group;

    // Apply cartoon cel-shading + team tint
    fullTripoBody.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const origMat = mesh.material as THREE.Material & { map?: THREE.Texture | null; color?: THREE.Color };
        mesh.material = makeToon({
          map: origMat?.map || null,
          color: origMat?.color || 0xffffff,
          teamColor: teamColorHex,
          isTeamMasked: true,
        });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    // Add crisp cartoon outlines
    addOutline(fullTripoBody, 0.022, 0x141424);

    // Normalize bounds: center on X/Z, base at Y=0, target height = 1.6m
    const tBox = new THREE.Box3().setFromObject(fullTripoBody);
    const tHeight = tBox.max.y - tBox.min.y;
    const tScale = 1.6 / (tHeight || 1.6);
    fullTripoBody.scale.setScalar(tScale);

    const scaledBox = new THREE.Box3().setFromObject(fullTripoBody);
    const tCenter = scaledBox.getCenter(new THREE.Vector3());
    fullTripoBody.position.x = -tCenter.x;
    fullTripoBody.position.y = -scaledBox.min.y;
    fullTripoBody.position.z = -tCenter.z;

    group.add(fullTripoBody);

    // The full Tripo model is visible; keep dummy skeleton invisible
    clonedScene.visible = false;
    group.add(clonedScene);
  } else {
    // Fallback: Show dummy skeleton with head accessory
    addOutline(clonedScene, 0.022, 0x141424);
    group.add(clonedScene);

    // Normalize dummy bounds
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = box.getCenter(new THREE.Vector3());
    clonedScene.position.x = -center.x;
    clonedScene.position.y = -box.min.y;
    clonedScene.position.z = -center.z;
  }

  // 4. Locate bones in Mixamo biped hierarchy for engine contract
  const rawHips = findBone(clonedScene, 'Hips');
  const rawTorso = findBone(clonedScene, 'Spine1') || findBone(clonedScene, 'Spine');
  const rawHead = findBone(clonedScene, 'Head');
  const rawLeftArm = findBone(clonedScene, 'LeftArm');
  const rawRightArm = findBone(clonedScene, 'RightArm');
  const rawLeftForearm = findBone(clonedScene, 'LeftForeArm');
  const rawRightForearm = findBone(clonedScene, 'RightForeArm');
  const rawLeftHand = findBone(clonedScene, 'LeftHand');
  const rawRightHand = findBone(clonedScene, 'RightHand');
  const rawLeftLeg = findBone(clonedScene, 'LeftUpLeg');
  const rawRightLeg = findBone(clonedScene, 'RightUpLeg');
  const rawLeftLowerLeg = findBone(clonedScene, 'LeftLeg');
  const rawRightLowerLeg = findBone(clonedScene, 'RightLeg');
  const rawLeftFoot = findBone(clonedScene, 'LeftFoot');
  const rawRightFoot = findBone(clonedScene, 'RightFoot');

  // 5. Create PROXY Object3Ds for the engine
  const proxyHips = new THREE.Object3D();
  const proxyTorso = new THREE.Object3D();
  const proxyHead = new THREE.Object3D();
  const proxyLeftArm = new THREE.Object3D();
  const proxyRightArm = new THREE.Object3D();
  const proxyLeftForearm = new THREE.Object3D();
  const proxyRightForearm = new THREE.Object3D();
  const proxyLeftHand = new THREE.Object3D();
  const proxyRightHand = new THREE.Object3D();
  const proxyLeftLeg = new THREE.Object3D();
  const proxyRightLeg = new THREE.Object3D();
  const proxyLeftLowerLeg = new THREE.Object3D();
  const proxyRightLowerLeg = new THREE.Object3D();
  const proxyLeftFoot = new THREE.Object3D();
  const proxyRightFoot = new THREE.Object3D();

  const boneMappings: BoneMapping[] = [];
  function registerMapping(bone: THREE.Bone | null, proxy: THREE.Object3D, isRightArm = false) {
    if (bone) {
      boneMappings.push({
        bone,
        proxy,
        restQuat: bone.quaternion.clone(),
        restPos: bone.position.clone(),
        isRightArm,
      });
    }
  }

  registerMapping(rawHips, proxyHips);
  registerMapping(rawTorso, proxyTorso);
  registerMapping(rawHead, proxyHead);
  registerMapping(rawLeftArm, proxyLeftArm);
  registerMapping(rawRightArm, proxyRightArm, true);
  registerMapping(rawLeftForearm, proxyLeftForearm);
  registerMapping(rawRightForearm, proxyRightForearm);
  registerMapping(rawLeftHand, proxyLeftHand);
  registerMapping(rawRightHand, proxyRightHand);
  registerMapping(rawLeftLeg, proxyLeftLeg);
  registerMapping(rawRightLeg, proxyRightLeg);
  registerMapping(rawLeftLowerLeg, proxyLeftLowerLeg);
  registerMapping(rawRightLowerLeg, proxyRightLowerLeg);
  registerMapping(rawLeftFoot, proxyLeftFoot);
  registerMapping(rawRightFoot, proxyRightFoot);

  // 6. Base aura ring on feet (from toy_mecha contract)
  const auraGeo = new THREE.RingGeometry(0.38, 0.45, 32);
  auraGeo.rotateX(-Math.PI / 2);
  const auraMat = new THREE.MeshBasicMaterial({
    color: teamColorHex,
    transparent: true,
    opacity: opts.isPlayer ? 0.85 : 0.45,
    side: THREE.DoubleSide,
  });
  const auraRing = new THREE.Mesh(auraGeo, auraMat);
  auraRing.position.y = 0.01;
  group.add(auraRing);

  // 7. Additive animation update called every frame
  let walkPhaseInternal = 0;
  const applyBoneDeltas = () => {
    // A. Update dummy skeleton
    for (let i = 0; i < boneMappings.length; i++) {
      const m = boneMappings[i];
      m.bone.quaternion.copy(m.restQuat).multiply(m.proxy.quaternion);
      m.bone.scale.copy(m.proxy.scale);

      if (m.isRightArm) {
        const punchOffsetZ = m.proxy.position.z - 0.06;
        if (Math.abs(punchOffsetZ) > 0.01) {
          m.bone.position.z = m.restPos.z + punchOffsetZ * 0.8;
        } else {
          m.bone.position.z = m.restPos.z;
        }
      }
    }

    // B. Procedural animation on the Full Tripo Character Body
    if (fullTripoBody) {
      // 1. Punch thrust & lunge
      const punchZ = proxyRightArm.position.z - 0.06;
      if (punchZ > 0.05) {
        fullTripoBody.position.z = punchZ * 0.45;
        fullTripoBody.scale.set(1.0 + punchZ * 0.15, 1.0, 1.0 + punchZ * 0.2);
        fullTripoBody.rotation.y = -punchZ * 0.25;
      } else {
        fullTripoBody.position.z = 0;
        fullTripoBody.scale.set(1.0, 1.0, 1.0);
        fullTripoBody.rotation.y = 0;
      }

      // 2. Waddling leg walk tilt
      const legRoll = proxyLeftLeg.rotation.x - proxyRightLeg.rotation.x;
      if (Math.abs(legRoll) > 0.1) {
        walkPhaseInternal += 0.15;
        fullTripoBody.rotation.z = Math.sin(walkPhaseInternal) * 0.08;
        fullTripoBody.position.y = Math.abs(Math.sin(walkPhaseInternal * 2)) * 0.08;
      } else {
        fullTripoBody.rotation.z = 0;
        fullTripoBody.position.y = 0;
      }
    }
  };

  // 8. Assign userData contract identical to toy_mecha.js
  group.userData = {
    root: fullTripoBody || clonedScene,
    isTripoFighter: true,
    isFullTripoBody: !!fullTripoBody,
    hips: proxyHips,
    baseHipsY: 0.52,
    torso: proxyTorso,
    head: proxyHead,
    leftArm: proxyLeftArm,
    rightArm: proxyRightArm,
    leftForearm: proxyLeftForearm,
    rightForearm: proxyRightForearm,
    leftHand: proxyLeftHand,
    rightHand: proxyRightHand,
    leftLeg: proxyLeftLeg,
    rightLeg: proxyRightLeg,
    leftLowerLeg: proxyLeftLowerLeg,
    rightLowerLeg: proxyRightLowerLeg,
    leftFoot: proxyLeftFoot,
    rightFoot: proxyRightFoot,
    eyes: [],
    flames: [],
    auraRing,
    propeller: null,
    bunnyEars: null,
    walkPhase: 0,
    punchPhase: 0,
    team: opts.team,
    isPlayer: opts.isPlayer,
    number: opts.number,
    costume: opts.costume,
    fighterIndex: opts.fighterIndex,
    jerseyMat: sharedToonMat,
    applyBoneDeltas,
  };

  return group;
}
