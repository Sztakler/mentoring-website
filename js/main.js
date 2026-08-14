import * as THREE from "three";
import { config } from "./config.js";

import noiseFrag from "./shaders/noise.frag";
import bgVert from "./shaders/background.vert";
import bgFrag from "./shaders/background.frag";
import glassVert from "./shaders/glass.vert";
import glassFrag from "./shaders/glass.frag";

async function init() {
  const container = document.getElementById("canvas-container");
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  container.appendChild(renderer.domElement);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
  camera.position.z = 1;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#0a0a0a");

  const noiseTarget = new THREE.WebGLRenderTarget(256, 256, {
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
  });

  const renderTarget = new THREE.WebGLRenderTarget(innerWidth, innerHeight, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    depthBuffer: false,
  });

  const quadScene = new THREE.Scene();
  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const glassMaterial = new THREE.ShaderMaterial({
    vertexShader: glassVert,
    fragmentShader: glassFrag,
    uniforms: {
      uScene: { value: null },
      uResolution: { value: new THREE.Vector2(innerWidth, innerHeight) },
      uTime: { value: 0 },
      uStripesCount: { value: config.stripesCount },
      uReedStrength: { value: config.reedStrength },
      uChromaticStrength: { value: config.chromaticStrength },
      uBlurStrength: { value: config.blurStrength },
      uGlassColor: { value: new THREE.Color(config.glassColor) },
      uGlassOpacity: { value: config.glassOpacity },
      uGrainStrength: { value: config.grainStrength },
    },
  });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), glassMaterial);
  quadScene.add(quad);

  function createGradientTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 512, 0);

    grad.addColorStop(0.0, "rgb(10, 10, 12)");
    grad.addColorStop(0.9, "rgb(245, 235, 220)");
    grad.addColorStop(0.5, "rgb(31, 62, 214)");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 1);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  const gradientTexture = createGradientTexture();

  const gradientMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uNoiseMap: { value: noiseTarget.texture },
      uCloudDensity: { value: config.cloudDensity },
      uCloudSize: { value: config.cloudSize },
      uWarpStrength: { value: config.warpStrength },
      uGradientMap: { value: gradientTexture },
      uAspect: { value: innerWidth / innerHeight },
    },
    vertexShader: bgVert,
    fragmentShader: bgFrag,
  });

  const noiseScene = new THREE.Scene();
  const noiseCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const noiseMaterial = new THREE.ShaderMaterial({
    vertexShader: glassVert,
    fragmentShader: noiseFrag,
    uniforms: { uTime: { value: 0 } },
  });

  const noiseQuad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    noiseMaterial,
  );
  noiseScene.add(noiseQuad);

  const gradientPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    gradientMaterial,
  );
  scene.add(gradientPlane);

  window.addEventListener("resize", () => {
    const aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    renderTarget.setSize(innerWidth, innerHeight);

    gradientMaterial.uniforms.uAspect.value = aspect;
    glassMaterial.uniforms.uResolution.value.set(innerWidth, innerHeight);
  });

  let lastTime = performance.now();
  let accumulatedTime = 0.0;

  function animate() {
    requestAnimationFrame(animate);

    const currentTime = performance.now();
    const delta = (currentTime - lastTime) * 0.001;
    lastTime = currentTime;

    accumulatedTime += delta * config.gradientSpeed;

    noiseMaterial.uniforms.uTime.value = accumulatedTime;
    glassMaterial.uniforms.uTime.value = accumulatedTime;
    gradientMaterial.uniforms.uTime.value = accumulatedTime;

    renderer.setRenderTarget(noiseTarget);
    renderer.render(noiseScene, noiseCamera);

    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);

    glassMaterial.uniforms.uScene.value = renderTarget.texture;
    renderer.setRenderTarget(null);
    renderer.render(quadScene, quadCamera);
  }

  animate();
}

init();
