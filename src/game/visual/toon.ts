import * as THREE from 'three';

// 1. Shared 3-step cel-shading gradient map (shadow, midtone, highlight)
let sharedGradientMap: THREE.DataTexture | null = null;

export function getSharedGradientMap(): THREE.DataTexture {
  if (sharedGradientMap) return sharedGradientMap;

  // 3 distinct color steps for vibrant Saturday-morning cartoon look
  const colors = new Uint8Array([70, 160, 255]);
  const format = THREE.RedFormat;
  const texture = new THREE.DataTexture(colors, 3, 1, format);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  sharedGradientMap = texture;
  return sharedGradientMap;
}

export interface ToonMaterialOptions {
  color?: THREE.ColorRepresentation;
  map?: THREE.Texture | null;
  roughness?: number;
  transparent?: boolean;
  opacity?: number;
  teamColor?: THREE.ColorRepresentation;
  isTeamMasked?: boolean;
}

/**
 * Creates a vibrant MeshToonMaterial with shared gradient map.
 * Supports team color masking onBeforeCompile if isTeamMasked is true.
 */
export function makeToon(options: ToonMaterialOptions = {}): THREE.MeshToonMaterial {
  const gradientMap = getSharedGradientMap();
  const mat = new THREE.MeshToonMaterial({
    gradientMap,
    color: options.color !== undefined ? options.color : 0xffffff,
    map: options.map || null,
    transparent: !!options.transparent,
    opacity: options.opacity ?? 1.0,
  });

  if (options.isTeamMasked && options.teamColor) {
    const teamCol = new THREE.Color(options.teamColor);
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTeamColor = { value: teamCol };
      // Replace light-grey/white texels with team color, keeping face/dark colors intact
      shader.fragmentShader = `
        uniform vec3 uTeamColor;
      ` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>
        #ifdef USE_MAP
          // If texel is bright desaturated (white / light-grey body suit), tint with team color
          float brightness = (sampledDiffuseColor.r + sampledDiffuseColor.g + sampledDiffuseColor.b) / 3.0;
          float saturation = max(max(sampledDiffuseColor.r, sampledDiffuseColor.g), sampledDiffuseColor.b) - min(min(sampledDiffuseColor.r, sampledDiffuseColor.g), sampledDiffuseColor.b);
          if (brightness > 0.45 && saturation < 0.25) {
            diffuseColor.rgb *= uTeamColor;
          }
        #endif
        `
      );
    };
  }

  return mat;
}

/**
 * Adds inverted-hull cartoon outlines to any Object3D hierarchy.
 * Supports both static Mesh and animated SkinnedMesh.
 */
export function addOutline(
  root: THREE.Object3D,
  thickness: number = 0.022,
  outlineColor: THREE.ColorRepresentation = 0x141424
): THREE.Object3D[] {
  const outlineMeshes: THREE.Object3D[] = [];

  root.traverse((node) => {
    // Only process original meshes, avoid doubling outlines if run repeatedly
    if (node.userData.isOutlineMesh) return;

    if ((node as THREE.Mesh).isMesh) {
      const mesh = node as THREE.Mesh;
      const isSkinned = (node as THREE.SkinnedMesh).isSkinnedMesh;

      const outlineMat = new THREE.MeshBasicMaterial({
        color: outlineColor,
        side: THREE.BackSide,
      });

      outlineMat.onBeforeCompile = (shader) => {
        shader.uniforms.uThickness = { value: thickness };
        shader.vertexShader = `
          uniform float uThickness;
        ` + shader.vertexShader;

        // Extrude vertices along normal on backfaces
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>
          transformed += normal * uThickness;
          `
        );
      };

      let outlineNode: THREE.Mesh;
      if (isSkinned) {
        const skinnedMesh = mesh as THREE.SkinnedMesh;
        const skinnedOutline = new THREE.SkinnedMesh(skinnedMesh.geometry, outlineMat);
        skinnedOutline.bind(skinnedMesh.skeleton, skinnedMesh.bindMatrix);
        outlineNode = skinnedOutline;
      } else {
        outlineNode = new THREE.Mesh(mesh.geometry, outlineMat);
      }

      outlineNode.userData.isOutlineMesh = true;
      outlineNode.renderOrder = (mesh.renderOrder || 0) - 1;
      mesh.add(outlineNode);
      outlineMeshes.push(outlineNode);
    }
  });

  return outlineMeshes;
}

/**
 * Creates a standalone inverted-hull outline mesh matching a given mesh.
 */
export function createOutlineMesh(
  mesh: THREE.Mesh,
  thickness: number = 0.025,
  outlineColor: THREE.ColorRepresentation = 0x141424
): THREE.Mesh {
  const outlineMat = new THREE.MeshBasicMaterial({
    color: outlineColor,
    side: THREE.BackSide,
  });

  outlineMat.onBeforeCompile = (shader) => {
    shader.uniforms.uThickness = { value: thickness };
    shader.vertexShader = `
      uniform float uThickness;
    ` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      transformed += normal * uThickness;
      `
    );
  };

  const outline = new THREE.Mesh(mesh.geometry, outlineMat);
  outline.position.copy(mesh.position);
  outline.rotation.copy(mesh.rotation);
  outline.scale.copy(mesh.scale);
  outline.userData.isOutlineMesh = true;
  outline.renderOrder = (mesh.renderOrder || 0) - 1;
  return outline;
}

/**
 * Replaces Tripo PBR materials on a hierarchy with toon materials and adds outlines.
 */
export function applyToonAndOutline(
  root: THREE.Object3D,
  options: {
    thickness?: number;
    outlineColor?: THREE.ColorRepresentation;
    teamColor?: THREE.ColorRepresentation;
    isTeamMasked?: boolean;
  } = {}
) {
  root.traverse((node) => {
    if (node.userData.isOutlineMesh) return;

    if ((node as THREE.Mesh).isMesh) {
      const mesh = node as THREE.Mesh;
      const curMat = mesh.material as THREE.Material & {
        map?: THREE.Texture | null;
        color?: THREE.Color;
        transparent?: boolean;
        opacity?: number;
      };

      if (curMat && !curMat.userData?.isToon) {
        const toonMat = makeToon({
          map: curMat.map || null,
          color: curMat.color || 0xffffff,
          transparent: curMat.transparent,
          opacity: curMat.opacity,
          teamColor: options.teamColor,
          isTeamMasked: options.isTeamMasked,
        });
        toonMat.userData = { isToon: true };
        mesh.material = toonMat;
      }
    }
  });

  addOutline(root, options.thickness ?? 0.022, options.outlineColor ?? 0x141424);
}
