uniform vec2 uAmplitude;
uniform vec2 uFrequency;
uniform float uTime;
uniform float uIntensity;

varying vec2 vUv;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    // modelPosition.y += sin(modelPosition.x * uFrequency.x - uIntensity) * uAmplitude.x;
    // modelPosition.x += cos(modelPosition.y * uFrequency.y - uIntensity) * uAmplitude.y;

    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;
    vUv = uv;
}