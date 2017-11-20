var config = (function() {
  var bacteriaShaderStr = `
    /*
    shader from: http://phaser.io/examples/v2/filters/multiple-shaders
    */

    precision mediump float;

    uniform float     time;
    uniform vec2      resolution;
    uniform vec2      mouse;

    float length2(vec2 p) { return dot(p, p); }

    float noise(vec2 p){
        return fract(sin(fract(sin(p.x) * (43.13311)) + p.y) * 31.0011);
    }

    float worley(vec2 p) {
        float d = 1e30;
        for (int xo = -1; xo <= 1; ++xo) {
            for (int yo = -1; yo <= 1; ++yo) {
                vec2 tp = floor(p) + vec2(xo, yo);
                d = min(d, length2(p - tp - vec2(noise(tp))));
            }
        }
        return 3.0*exp(-4.0*abs(2.0*d - 1.0));
    }

    float fworley(vec2 p) {
        return sqrt(sqrt(sqrt(
        1.1 * // light
        worley(p*5. + .3 + time*.0525) *
        sqrt(worley(p * 50. + 0.3 + time * -0.15)) *
        sqrt(sqrt(worley(p * -10. + 9.3))))));
    }

    void main() {
        vec4 finalColor = vec4(0, 1.0, 0, 1.0);
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        // float t = fworley(uv * resolution.xy / 1500.0);
        // t *= exp(-length2(abs(0.7*uv - 1.0)));

        if (uv.x > 0.5 && uv.y < 0.5)
            finalColor.rgb = vec3(1.0, 0.0, 0.0);
        else if (uv.x > 0.5 && uv.y > 0.5)
            finalColor.rgb = vec3(0.0, 1.0, 0.0);
        else if (uv.x < 0.5 && uv.y < 0.5)
            finalColor.rgb = vec3(0.0, 0.0, 1.0);
        else
            finalColor.rgb = vec3(0.5, 0.5, 0.5);

        // vec4 finalColor = vec4(t * vec3(0.1, 1.5*t, 1.2*t + pow(t, 0.5-t)), 1.0);


        gl_FragColor = finalColor;
    }
  `;

  return {
    gameWidth: 1920,
    gameHeight: 1080,
    speedMultipler: 2.0,
    bacteriaShaderStr: bacteriaShaderStr
  };
})();
