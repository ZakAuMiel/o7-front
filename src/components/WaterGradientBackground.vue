<script setup lang="ts">
import { TresCanvas } from "@tresjs/core";
import { Color, Mesh, PlaneGeometry, ShaderMaterial } from "three";

// 🔧 Uniforms (paramètres proches de ton ShaderGradient)
const uniforms = {
  uTime: { value: 0 },
  uSpeed: { value: 0.2 }, // uSpeed=0.2
  uStrength: { value: 1.5 }, // uStrength=1.5
  uDensity: { value: 1.5 }, // uDensity=1.5
  uBrightness: { value: 1.0 }, // brightness=1
  uReflection: { value: 0.1 }, // reflection=0.1
  uColor1: { value: new Color("#606080") }, // color1
  uColor2: { value: new Color("#8d7dca") }, // color2
  uColor3: { value: new Color("#212121") }, // color3
};

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uStrength;
  uniform float uDensity;

  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  // simple 2D waves for water
  float wave(vec2 p, float t) {
    float w1 = sin(p.x * uDensity + t) * 0.25;
    float w2 = cos(p.y * uDensity * 1.3 - t * 1.2) * 0.2;
    return w1 + w2;
  }

  void main() {
    vec3 pos = position;
    float t = uTime * uSpeed;

    float h = wave(pos.xz, t) * uStrength;
    pos.y += h;

    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPosition.xyz;

    vNormal = normalize(normalMatrix * normal);

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform float uBrightness;
  uniform float uReflection;
  uniform float uTime;

  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  // cheap hash noise for grain
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  void main() {
    vec3 normal = normalize(vNormal);

    // mélange de couleurs en fonction de la normale et de la hauteur
    float nDotUp = clamp(normal.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 col = mix(uColor1, uColor2, nDotUp);

    float height = clamp((vWorldPosition.y + 1.0) * 0.5, 0.0, 1.0);
    col = mix(col, uColor3, 1.0 - height);

    // pseudo-lumière directionnelle
    vec3 lightDir = normalize(vec3(-0.4, 1.0, 0.2));
    float diff = max(dot(normal, lightDir), 0.0);
    float spec = pow(max(dot(reflect(-lightDir, normal), vec3(0.0, 1.0, 0.0)), 0.0), 32.0);

    col *= (0.35 + 0.75 * diff);
    col += spec * 0.4;

    // teinte "reflection" un peu froide
    vec3 envColor = vec3(0.08, 0.1, 0.16);
    col = mix(col, envColor, uReflection);

    // grain
    float g = noise(vWorldPosition.xz * 18.0 + uTime * 1.5);
    col += (g - 0.5) * 0.08;

    col *= uBrightness;
    col = clamp(col, 0.0, 1.0);

    gl_FragColor = vec4(col, 1.0);
  }
`;

// géométrie + material three classiques
const geometry = new PlaneGeometry(8, 8, 256, 256);
const material = new ShaderMaterial({
  uniforms,
  vertexShader,
  fragmentShader,
});
const mesh = new Mesh(geometry, material);
// on incline le plan pour matcher la vue "waterPlane"
mesh.rotation.x = -Math.PI / 2;

// 🔄 Animation via l'event @loop de TresCanvas (v5)
const onLoop = ({ elapsed }: { elapsed: number }) => {
  uniforms.uTime.value = elapsed;
};
</script>

<template>
  <TresCanvas
    class="absolute inset-0 -z-20"
    clear-color="#000000"
    window-size
    @loop="onLoop"
  >
    <!-- Caméra : équivalent de cAzimuthAngle / rotationX etc, on cible surtout le feeling -->
    <TresPerspectiveCamera
      :position="[-2.76, 0.48, 0]"
      :fov="45"
      :look-at="[0, 0, 0]"
    />

    <TresAmbientLight :intensity="0.4" />
    <TresDirectionalLight :position="[2, 3, 2]" :intensity="1.4" />

    <primitive :object="mesh" />
  </TresCanvas>
</template>
