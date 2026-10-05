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
}

interface BoneMapping {
  bone: THREE.Bone;
  proxy: THREE.Object3D;
  restQuat: THREE.Quaternion;
  restPos: THREE.Vector3;
  isRightArm?: boolean;
}

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
 * to the userData contract expected by engine.ts (lines 910-939 in toy_mecha.js).
 */
export function createTripoFighter(
  _THREE: typeof THREE,
  fighterGltf: GLTF,
  opts: TripoFighterOptions
): THREE.Group {
  const group = new THREE.Group();

  // 1. Clone skinned mesh with skeleton preserved
  const clonedScene = SkeletonUtils.clone(fighterGltf.scene) as THREE.Group;
  group.add(clonedScene);

  // 2. Team color configuration
  const teamColorHex = opts.team === 0 ? 0x27e5ff : 0xff5268;

  // Replace materials with Toon material + team color mask on suit
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

  // Add crisp cartoon outlines
  addOutline(clonedScene, 0.022, 0x141424);

  // 3. Locate bones in Mixamo biped hierarchy
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

  // 4. Create PROXY Object3Ds for the engine
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

  // Store rest poses for additive blending
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

  // 5. Attach accessories to the Head bone
  if (rawHead) {
    let accessoryGltf: GLTF | null = null;
    let accScale = 0.55;
    let accOffset = new THREE.Vector3(0, 0.22, 0);

    if (opts.isPlayer) {
      // Golden Crown for player
      accessoryGltf = getLoadedGLTF('acc-crown');
      accScale = 0.45;
      accOffset.set(0, 0.24, 0);
    } else if (opts.team === 0) {
      // Cyan Ribbon Bow
      accessoryGltf = getLoadedGLTF('acc-bow');
      accScale = 0.48;
      accOffset.set(0, 0.20, -0.05);
    } else {
      // Coral Party Hat
      accessoryGltf = getLoadedGLTF('acc-partyhat');
      accScale = 0.50;
      accOffset.set(0, 0.22, 0);
    }

    if (accessoryGltf) {
      const accModel = SkeletonUtils.clone(accessoryGltf.scene) as THREE.Group;
      accModel.scale.setScalar(accScale);
      accModel.position.copy(accOffset);
      accModel.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          const mesh = node as THREE.Mesh;
          const origMat = mesh.material as THREE.Material & { map?: THREE.Texture | null; color?: THREE.Color };
          mesh.material = makeToon({
            map: origMat?.map || null,
            color: origMat?.color || 0xffffff,
          });
        }
      });
      addOutline(accModel, 0.025, 0x141424);
      rawHead.add(accModel);
    }
  }

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

  // 7. Normalize placement: Base at y=0, centered on X and Z, front faces +Z
  const box = new THREE.Box3().setFromObject(clonedScene);
  const center = box.getCenter(new THREE.Vector3());
  clonedScene.position.x = -center.x;
  clonedScene.position.y = -box.min.y;
  clonedScene.position.z = -center.z;

  // 8. Additive update function called every frame
  const applyBoneDeltas = () => {
    for (let i = 0; i < boneMappings.length; i++) {
      const m = boneMappings[i];
      // Blend procedural proxy rotation onto bone's rest orientation
      m.bone.quaternion.copy(m.restQuat).multiply(m.proxy.quaternion);
      m.bone.scale.copy(m.proxy.scale);

      if (m.isRightArm) {
        // Handle punch extension along arm thrust axis
        const punchOffsetZ = m.proxy.position.z - 0.06;
        if (Math.abs(punchOffsetZ) > 0.01) {
          m.bone.position.z = m.restPos.z + punchOffsetZ * 0.8;
        } else {
          m.bone.position.z = m.restPos.z;
        }
      }
    }
  };

  // 9. Assign userData contract identical to toy_mecha.js
  group.userData = {
    root: clonedScene,
    isTripoFighter: true,
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
    jerseyMat: sharedToonMat,
    applyBoneDeltas,
  };

  return group;
}
