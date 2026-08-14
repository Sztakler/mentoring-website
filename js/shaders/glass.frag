precision highp float;
varying vec2 vUv;
uniform sampler2D uScene;
uniform vec2 uResolution;
uniform float uTime;
uniform float uStripesCount;
uniform float uReedStrength;
uniform float uChromaticStrength;
uniform float uBlurStrength;
uniform vec3 uGlassColor;
uniform float uGlassOpacity;
uniform float uGrainStrength;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec3 getBlurredColor(sampler2D tex, vec2 uv, vec2 distortion, float blurAmount, float chromaAmount) {
  vec3 accumulatedColor = vec3(0.0);
  float totalWeight = 0.0;
  float goldenAngle = 2.39996323;

  for (float i = 0.0; i < 16.0; i++) {
    float r = sqrt(i + 0.5) / sqrt(16.0);
    float theta = i * goldenAngle;

    vec2 blurOffset = vec2(cos(theta), sin(theta)) * r * blurAmount;
    vec2 sampleUv = uv + (blurOffset / uResolution);
    vec2 chromaOffset = distortion * chromaAmount * (r * 0.5 + 0.5);

    float redSample   = texture2D(tex, sampleUv + chromaOffset).r;
    float greenSample = texture2D(tex, sampleUv).g;
    float blueSample  = texture2D(tex, sampleUv - chromaOffset).b;

    accumulatedColor += vec3(redSample, greenSample, blueSample);
    totalWeight += 1.0;
  }

  return accumulatedColor / totalWeight;
}

void main() {
  float t = fract(vUv.x * uStripesCount);
  float x = sin(t * 3.14159265 - 1.57079633);
  float distSq = x * x;
  vec2 normal = vec2(x, sqrt(max(0.001, 1.0 - distSq)));

  vec2 distortion = normal * uReedStrength * 0.5;
  vec2 uv = vUv + distortion;

  vec3 color = getBlurredColor(uScene, uv, normal, uBlurStrength, uChromaticStrength);
  color = mix(color, uGlassColor, uGlassOpacity);
  color += (hash(gl_FragCoord.xy + uTime) - 0.5) * uGrainStrength;

  vec3 reflection = texture2D(uScene, uv + (normal * 0.1)).rgb;
  float edgeHighlight = pow(abs(normal.x), 2.0);
  color = mix(color, reflection * 1.5, edgeHighlight * 0.3);

  gl_FragColor = vec4(color, 1.0);
}
