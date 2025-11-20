<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  PlaneGeometry,
  ShaderMaterial,
  Mesh,
  Color,
} from "three";

const canvasRef = ref<HTMLCanvasElement | null>(null);

let renderer: WebGLRenderer | null = null;
let scene: Scene | null = null;
let camera: PerspectiveCamera | null = null;
let mesh: Mesh | null = null;
let animationId = 0;
let startTime = 0;

// Uniforms proches de ton preset ShaderGradient (waterPlane)
const uniforms = {
  uTime: { value: 0 },
  uStrength: { value: 2.5 }, // amplitude des bosses
  uDensity: { value: 0.1 }, // densité du bruit (plus petit -> vagues plus larges)
  uSpeed: { value: 0.15 },

  uColor1: { value: new Color("#d0d8e8") }, // gris blanc bleuté
  uColor2: { value: new Color("#8d7dca") }, // violet lumineux
  uColor3: { value: new Color("#212121") }, // quasi noir
  uGrainStrength: { value: 0.14 }, // force du grain
};

const vertexShader = /* glsl */ `
  // ---- Simplex noise 2D (compact) ----
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865, 0.366025403, -0.577350269, 1.0);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0): vec2(0.0, 1.0);
    vec2 x1 = x0.xy + C.xx - i1;
    vec2 x2 = x0.xy + C.zz;
    i = mod289(i);

    vec3 p = permute(
                permute(i.y + vec3(0.0, i1.y, 1.0))
              + i.x + vec3(0.0, i1.x, 1.0)
            );

    vec3 m = max(
      0.5 - vec3(
        dot(x0,x0),
        dot(x1,x1),
        dot(x2,x2)
      ),
      0.0
    );
    m = m * m;
    m = m * m;

    vec3 x = 2.0 * fract(p * C.www) - 1.0;

    return 70.0 * dot(m, x);
  }

  uniform float uTime;
  uniform float uStrength;
  uniform float uDensity;
  uniform float uSpeed;

  varying float vHeight;
  varying vec3 vWorldPosition;

  void main() {
    vec3 pos = position;
    float t = uTime * uSpeed;

    // plane en XZ (on va le poser à plat), donc on prend pos.xz
    vec2 p = pos.xz * uDensity;

    // FBM simple 2 couches pour des bosses organiques
    float n1 = snoise(p + vec2(t, -t));
    float n2 = snoise(p * 0.6 + vec2(-t * 0.7, t * 0.5));

    float n = n1 * 0.7 + n2 * 0.3;

    // déplacement vertical
    pos.y += n * uStrength;

    vHeight = pos.y;

    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPosition.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform float uGrainStrength;

  varying vec3 vWorldPosition;
  varying float vHeight;

  // hash pour le grain (statique)
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    // profondeur -> haut plus sombre, bas plus violet
    float depth = clamp((vWorldPosition.z + 18.0) / 36.0, 0.0, 1.0);

    // base: violet lumineux en bas -> noir en haut
    vec3 base = mix(uColor2, uColor3, depth);

    // hauteur normalisée de la vague
    float hNorm = clamp((vHeight + 3.0) / 6.0, 0.0, 1.0);

    // teinte : plus la vague est haute, plus on tire vers uColor1 (gris/violet clair)
    vec3 col = mix(base, uColor1, hNorm);

    // luminosité : plus c'est haut, plus c'est bright
    float bright = 0.8 + 0.9 * hNorm; // tweakable
    col *= bright;

    // vignette douce pour garder les bords un peu plus sombres
    float r = length(vWorldPosition.xz) / 22.0;
    float vignette = smoothstep(0.0, 0.9, 1.0 - r);
    col *= mix(0.5, 1.0, vignette);

    // grain statique
    float g = hash(gl_FragCoord.xy * 0.9);
    col += (g - 0.5) * uGrainStrength;

    col = clamp(col, 0.0, 1.0);
    gl_FragColor = vec4(col, 1.0);
  }
`;


function init() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  scene = new Scene();

  const width = window.innerWidth;
  const height = window.innerHeight;

  camera = new PerspectiveCamera(45, width / height, 0.1, 100);
  // caméra au-dessus de la nappe, légère plongée, comme ShaderGradient
  camera.position.set(0, 9.0, 5.0);
  camera.lookAt(0, 0, 0);

  renderer = new WebGLRenderer({
    canvas,
    antialias: true,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));

  // grand plan en XZ
  const geometry = new PlaneGeometry(40, 40, 260, 260);
  geometry.rotateX(-Math.PI / 2); // on le pose à plat

  const material = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
  });

  mesh = new Mesh(geometry, material);
  // légère rotation pour casser la symétrie comme sur ton screen
  mesh.rotation.y = -Math.PI * 0.12;
  scene.add(mesh);

  startTime = performance.now();
  animate();
}

function animate() {
  if (!renderer || !scene || !camera) return;

  const now = performance.now();
  uniforms.uTime.value = (now - startTime) / 1000.0;

  renderer.render(scene, camera);
  animationId = window.requestAnimationFrame(animate);
}

function onResize() {
  if (!renderer || !camera) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

onMounted(() => {
  init();
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  if (animationId) cancelAnimationFrame(animationId);
  renderer?.dispose();
});
</script>

<template>
  <canvas
    ref="canvasRef"
    class="absolute inset-0 z-0 block w-full h-full pointer-events-none"
  />
</template>
