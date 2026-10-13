/**
 * Avatar VRoid (opcional): se sienta en la silla, teclea en modo lofi y baila en bachata.
 * Las librerías pesadas se descargan solo si hay un avatar configurado (import dinámico).
 * Aún sin probar con un modelo real: las poses pueden necesitar ajustes.
 */
import * as THREE from "three";
import { CHAIR } from "./layout.js";

const LEG_BONES = { upper: ["leftUpperLeg", "rightUpperLeg"], lower: ["leftLowerLeg", "rightLowerLeg"] };

/**
 * @param {THREE.Scene} scene
 * @param {string} url ruta del archivo .vrm; vacío = sin avatar
 * @returns {Promise<{ pose: (frame: object) => void } | null>}
 */
export async function loadAvatar(scene, url) {
  if (!url) return null;

  const [{ GLTFLoader }, { VRMLoaderPlugin, VRMUtils }] = await Promise.all([
    import("three/addons/loaders/GLTFLoader.js"),
    import("@pixiv/three-vrm"),
  ]);
  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));
  const gltf = await loader.loadAsync(url);
  const vrm = gltf.userData.vrm;

  VRMUtils.removeUnnecessaryVertices(gltf.scene);
  VRMUtils.rotateVRM0(vrm); // los VRM 0.x miran al revés; así todos miran a +z
  vrm.scene.traverse((object) => {
    if (!object.isMesh) return;
    object.frustumCulled = false;
    object.castShadow = true;
  });
  vrm.scene.rotation.y = -Math.PI / 2; // +z → -x: mirando a la laptop
  vrm.scene.position.set(CHAIR.x - 0.05, 0, CHAIR.z);
  scene.add(vrm.scene);

  const bone = (name) => vrm.humanoid.getNormalizedBoneNode(name);
  /** Aplica una rotación solo si el modelo tiene ese hueso. */
  const rotate = (name, x, y, z) => bone(name)?.rotation.set(x, y, z);

  // Sentarse: muslos al frente y canillas hacia abajo; luego se baja todo el cuerpo
  // hasta que la cadera toque el asiento.
  for (const name of LEG_BONES.upper) rotate(name, -Math.PI / 2, 0, 0);
  for (const name of LEG_BONES.lower) rotate(name, Math.PI / 2, 0, 0);
  vrm.update(0);
  const hips = new THREE.Vector3();
  bone("hips").getWorldPosition(hips);
  vrm.scene.position.y -= hips.y - (CHAIR.seat + 0.12);

  /**
   * @param {object} frame
   * @param {number} frame.dt
   * @param {number} frame.t
   * @param {"lofi" | "bachata"} frame.mode
   * @param {number} frame.beatLevel
   * @param {number} frame.sway
   */
  function pose({ dt, t, mode, beatLevel, sway }) {
    if (mode === "lofi") {
      // Tecleando: brazos al frente, antebrazos sobre el teclado, un temblor de "dedos rápidos".
      rotate("leftUpperArm", -0.9, 0, -1.05 + Math.sin(t * 9) * 0.03);
      rotate("rightUpperArm", -0.9, 0, 1.05 + Math.sin(t * 8 + 1) * 0.03);
      rotate("leftLowerArm", 0, -0.9, 0);
      rotate("rightLowerArm", 0, 0.9, 0);
      rotate("spine", 0.12, 0, 0);
      rotate("head", 0.15 + Math.sin(t * 0.7) * 0.03, Math.sin(t * 0.4) * 0.05, 0);
      rotate("hips", 0, 0, 0);
    } else {
      // Bachata sentado: cadera y hombros al ritmo 1-2-3-tap, la cabeza sigue el golpe.
      rotate("leftUpperArm", -0.2, 0, -1.2 + beatLevel * 0.25);
      rotate("rightUpperArm", -0.2, 0, 1.2 - beatLevel * 0.25);
      rotate("leftLowerArm", 0, -0.6, 0);
      rotate("rightLowerArm", 0, 0.6, 0);
      rotate("spine", 0.02, sway * 0.18, sway * 0.12);
      rotate("head", -0.05 + beatLevel * 0.12, sway * 0.15, -sway * 0.1);
      rotate("hips", 0, sway * 0.12, 0);
    }
    vrm.update(dt);
  }

  return { pose };
}
