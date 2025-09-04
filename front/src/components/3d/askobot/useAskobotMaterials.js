import { useMemo, useEffect } from "react";
import { MeshPhysicalMaterial, ShaderMaterial, BackSide, DoubleSide, Uniform, Color, MeshStandardMaterial } from "three";
import vertexShader from "@/shaders/vertex.glsl";
import fragmentShader from "@/shaders/fragment.glsl";

export default function useAskobotMaterials(barNumber, barColor) {
  const { lensMaterial, equalizerMaterial, ledMaterial } = useMemo(() => {
    const lensMaterial = new MeshPhysicalMaterial({
      metalness: 0.9,
      roughness: 0.05,
      envMapIntensity: 0.9,
      clearcoat: 1,
      transparent: true,
      opacity: 0.5,
      reflectivity: 0.2,
      ior: 0.9,
      color: 0xf0f0f0,
      side: BackSide,
    });

    const equalizerMaterial = new ShaderMaterial({
      transparent: true,
      side: DoubleSide,
      uniforms: {
        uTime: new Uniform(0),
        uIntensity: new Uniform(0),
        uBarNumber: new Uniform(barNumber),
        uBarColor: new Uniform(new Color(barColor)),
      },
      vertexShader,
      fragmentShader,
    });

    const ledMaterial = new MeshStandardMaterial({
      transparent: true,
      color: [0.21994854509830475, 0.013376367278397083, 0.004396415781229734],
    });
    return { lensMaterial, equalizerMaterial, ledMaterial };
  }, []);

  useEffect(() => {
    equalizerMaterial.uniforms.uBarNumber.value = barNumber;
  }, [barNumber, equalizerMaterial]);

  useEffect(() => {
    equalizerMaterial.uniforms.uBarColor.value.set(barColor);
  }, [barColor, equalizerMaterial]);

  return { lensMaterial, equalizerMaterial, ledMaterial };
}
