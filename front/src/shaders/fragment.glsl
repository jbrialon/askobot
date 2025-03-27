uniform float uTime;
uniform float uIntensity;
uniform float uBarNumber;
uniform vec3 uBarColor;
varying vec2 vUv;

float random(float seed) {
    return fract(sin(seed * 78.233) * 43758.5453);
}

float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    float u = f * f * (3.0 - 2.0 * f);
    return mix(random(i), random(i + 1.0), u);
}

float getBarHeight(float index) {
    float normalizedIndex = index / (uBarNumber - 1.0) - 0.5;
    float distanceFromCenter = 1.0 - abs(normalizedIndex);

    float idleOscillation = uIntensity == 0.0 ? 0.15 + 0.05 * sin(uTime * 5.0 + index) : 0.0;
    // if (uIntensity > 0.0) {
    //     idleOscillation = 0.0;
    // }
    float height = clamp((distanceFromCenter - (abs(normalizedIndex) * sin(uIntensity * 90.0))) * pow(uIntensity * 2.0, 0.2), 0.1, 0.95);
    return height + idleOscillation;
}

void main() {
    vec2 uv = vUv;
  
    // Black background color
    vec3 backgroundColor = vec3(0.0);
    
    // Initialize color with background
    vec3 color = backgroundColor;
    
    // Calculate bar width and spacing
    float barWidth = 0.8 / uBarNumber;
    float spacing = 0.2 / (uBarNumber - 1.0);
    float totalBarWidth = barWidth + spacing;
    
    // Draw each bar
    for (int i = 0; i < int(uBarNumber); i++) {
        float index = float(i);
        float xStart = index * totalBarWidth;
        float barHeight = getBarHeight(index);
        vec3 barColor = uBarColor;

        // Check if current pixel is within this bar
        if (uv.x >= xStart && uv.x <= xStart + barWidth) {   
            float centerY = 0.5;
            float halfHeight = barHeight * 0.5;

            // Draw bars symmetrically from the center
            if (uv.y >= centerY - halfHeight && uv.y <= centerY + halfHeight) {                            
                color = barColor;
            }
        }
    }
    
    if(color.r == 0.0) {
        discard;
    }
    gl_FragColor = vec4(color, 1.0);
    
    #include <colorspace_fragment>
}
