precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uCloudDensity;
uniform sampler2D uNoiseMap;
uniform float uWarpStrength;
uniform sampler2D uGradientMap;
uniform float uAspect;
uniform float uCloudSize;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  f = f*f*(3.0-2.0*f);
  float a = hash(i); float b = hash(i+vec2(1.0,0.0));
  float c = hash(i+vec2(0.0,1.0)); float d = hash(i+vec2(1.0,1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for(int i=0; i<5; i++) { v += noise(p)*a; p *= 2.0; a *= 0.5; }
  return v;
}

void main() {
  vec2 aspectUv = vUv;
  aspectUv.x = (aspectUv.x - 0.5) * uAspect + 0.5;
  vec2 warpNoise = texture2D(uNoiseMap, vUv).rg * 2.0 - 1.0;
  vec2 uv = aspectUv + warpNoise * uWarpStrength;
  float t = uTime;

  vec2 p1 = vec2(0.5 + 0.35 * sin(t * 0.4), 0.5 + 0.3 * cos(t * 0.3));
  vec2 p2 = vec2(0.5 + 0.4 * cos(t * 0.5), 0.5 + 0.4 * sin(t * 0.2));
  vec2 p3 = vec2(0.5 + 0.2 * sin(t * 0.6), 0.5 + 0.2 * cos(t * 0.7));
  vec2 p4 = vec2(0.5 + 0.3 * cos(t * 0.3), 0.5 + 0.2 * sin(t * 0.5));
  vec2 p5 = vec2(0.5 + 0.4 * sin(t * 0.2), 0.5 + 0.3 * cos(t * 0.4));

  vec2 refraction = mix(warpNoise * uWarpStrength, -warpNoise * (uWarpStrength * 0.2), 0.0);
  vec2 finalUv = aspectUv + refraction;

  float R = uCloudSize;
  float d1 = smoothstep(R, 0.0, length(finalUv - p1));
  float d2 = smoothstep(R, 0.0, length(finalUv - p2));
  float d3 = smoothstep(R, 0.0, length(finalUv - p3));
  float d4 = smoothstep(R, 0.0, length(finalUv - p4));
  float d5 = smoothstep(R, 0.0, length(finalUv - p5));

  float d = max(d1, max(d2, max(d3, max(d4, d5))));

  vec3 colorBg = vec3(0.0, 0.02745, 0.1843);
  vec2 noiseOffset = vec2(t * 0.1, t * 0.05);

  float cloudNoise = fbm(finalUv * uCloudDensity - noiseOffset);
  float intensity = clamp(d * 0.8 + cloudNoise * 0.2, 0.0, 1.0);

  vec3 blobsColor = texture2D(uGradientMap, vec2(intensity, 0.5)).rgb;
  vec3 finalColor = mix(blobsColor, colorBg, 0.0);

  gl_FragColor = vec4(finalColor, 1.0);
}
