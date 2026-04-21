import * as THREE from 'three';

var overlay = document.getElementById('introOverlay');
if (!overlay) {
  window.dispatchEvent(new CustomEvent('introComplete'));
  throw new Error('no intro overlay');
}

var canvas = document.createElement('canvas');
canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;';
overlay.insertBefore(canvas, overlay.firstChild);

var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x1a0000, 1);

var scene  = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);

var clock = new THREE.Clock();

var uniforms = {
  uTime:               { value: 0 },
  uMouse:              { value: new THREE.Vector2(0.5, 0.5) },
  uResolution:         { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  uNoiseScale:         { value: 8.0 },
  uDistortionStrength: { value: 0.3 }
};

var vertexShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uDistortionStrength;

  float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    float n1 = noise(uv * 10.0 + uTime * 0.5);
    float n2 = noise(uv * 20.0 - uTime * 0.3);
    pos.z += sin(pos.x * 5.0 + uTime * 2.0) * uDistortionStrength * n1;
    pos.z += cos(pos.y * 8.0 + uTime * 1.5) * uDistortionStrength * n2;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

var fragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform float uNoiseScale;
  uniform float uDistortionStrength;
  varying vec2 vUv;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 6; i++) {
      value += amplitude * noise(st);
      st *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  vec3 distortedNoise(vec2 uv) {
    vec2 st = uv * uNoiseScale;
    float time = uTime * 0.5;
    vec2 q = vec2(fbm(st + vec2(0.0, 0.0)), fbm(st + vec2(5.2, 1.3)));
    vec2 r = vec2(
      fbm(st + 4.0 * q + vec2(1.7 - time * 0.15, 9.2)),
      fbm(st + 4.0 * q + vec2(8.3 - time * 0.126, 2.8))
    );
    float f = fbm(st + r);

    float glitch = step(0.98, random(vec2(floor(uTime * 10.0), floor(uv.y * 50.0))));
    f += glitch * 0.5;

    vec3 color = vec3(0.0);
    color.r = f * f * f + 0.6 * f * f + 0.5 * f;
    color.g = f * f * f * f + 0.4 * f * f + 0.2 * f;
    color.b = f * f * f * f * f * f + 0.7 * f * f + 0.5 * f;

    float noiseTexture = random(uv * 100.0 + time);
    color += noiseTexture * 0.1;

    float scanline = sin(uv.y * 800.0) * 0.04;
    color += scanline;

    return color;
  }

  void main() {
    vec2 uv = vUv;
    float aberration = 0.005;
    vec3 color;
    color.r = distortedNoise(uv + vec2(aberration, 0.0)).r;
    color.g = distortedNoise(uv).g;
    color.b = distortedNoise(uv - vec2(aberration, 0.0)).b;

    float grain = random(uv + uTime) * 0.1;
    color += grain;

    float vignette = 1.0 - length(uv - 0.5) * 1.2;
    color *= vignette;

    color = pow(color, vec3(1.2));
    color *= 1.3;

    gl_FragColor = vec4(color, 0.95);
  }
`;

var mesh = new THREE.Mesh(
  new THREE.PlaneGeometry(25, 25, 100, 100),
  new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true
  })
);
mesh.position.set(0, 0, -1);
scene.add(mesh);

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resize);

var running = true;
(function loop() {
  if (!running) return;
  requestAnimationFrame(loop);
  var t = clock.getElapsedTime();
  uniforms.uTime.value = t;
  uniforms.uDistortionStrength.value = 0.2 + Math.sin(t * 0.5) * 0.1;
  renderer.render(scene, camera);
})();

window.addEventListener('introComplete', function () {
  running = false;
  window.removeEventListener('resize', resize);
  renderer.dispose();
}, { once: true });
