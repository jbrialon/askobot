// Three
import { Color, Vector3, Object3D } from "three";

// React
import { useEffect, useRef, useMemo, useState } from "react";
import { Float, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

// App
import Manager from "../../../classes/manager";
import useAskobotModel from "./useAskobotModel";
import useAskobotMaterials from "./useAskobotMaterials";
import useAskobotAnimation from "./useAskobotAnimation";
import useAskobotAudio from "./useAskobotAudio";
import useAskobotControls from "./useAskobotControls";

// Store
import { useStore } from "../../../store/store";

// Curves
import { looping, intro } from "../spline/curves";

// Components
import Spline from "../spline/spline";

export default function Askobot() {
  const manager = useMemo(() => new Manager(), []);
  const scene = useStore((state) => state.scene);

  const botGroupRef = useRef();
  const botRef = useRef();

  const controlPointGroupRef = useRef(new Object3D());
  const controlPointRef = useRef();
  const velocity = useRef(new Vector3());

  // Custom spring strength
  const springVec = new Vector3(0.01, 0.02, 0.01); // Y has more pull
  const dampingVec = new Vector3(0.9, 0.92, 0.9); // Y retains more inertia

  // Model
  const { model, batteries, lens, lensMesh, wings, antennas, led, equilizer } =
    useAskobotModel();

  // Animations
  const animations = useAskobotAnimation(
    botRef,
    botGroupRef,
    controlPointGroupRef,
    controlPointRef,
    scene,
    {
      wings,
      antennas,
      lens,
      batteries,
      led,
    },
  );
  // Leva Controls
  const { barNumber, barColor, ledColor } = useAskobotControls(animations);
  // Materials
  const { lensMaterial, equalizerMaterial, ledMaterial } = useAskobotMaterials(
    barNumber,
    barColor,
    ledColor,
  );

  // Audio
  useAskobotAudio(manager, scene, animations, botRef, equalizerMaterial);

  // Hooks
  useEffect(() => {
    equalizerMaterial.uniforms.uBarNumber.value = barNumber;
    equalizerMaterial.uniforms.uBarColor.value.set(barColor);
  }, [barNumber, barColor, equalizerMaterial]);

  useEffect(() => {
    if (led && ledMaterial) {
      led.material = ledMaterial;
      led.material.color.set(new Color(ledColor));
    }
  }, [ledMaterial, ledColor, led]);

  useEffect(() => {
    lensMesh.forEach((mesh) => (mesh.material = lensMaterial));
    equilizer.material = equalizerMaterial;
    led.material = ledMaterial;
  }, [lensMesh, equilizer, lensMaterial, equalizerMaterial, ledMaterial]);

  // update loop to sync the position of the control point to the model with fake physics
  useFrame(() => {
    if (!botGroupRef.current) return;

    const bot = botGroupRef.current;
    const control = controlPointRef.current;
    if (!bot || !control) return;

    const pos = bot.position;
    const target = new Vector3();
    controlPointRef.current.getWorldPosition(target);

    const diff = target.clone().sub(pos);

    // Spring force
    velocity.current.x += diff.x * springVec.x;
    velocity.current.y += diff.y * springVec.y;
    velocity.current.z += diff.z * springVec.z;

    // Damping
    velocity.current.x *= dampingVec.x;
    velocity.current.y *= dampingVec.y;
    velocity.current.z *= dampingVec.z;

    // Apply
    pos.add(velocity.current);
  });

  return (
    <>
      <group
        ref={controlPointGroupRef}
        position={controlPointGroupRef.current.position}
      >
        <mesh ref={controlPointRef} scale={[0.5, 0.8, 0.5]} visible={false}>
          <octahedronGeometry args={[0.1, 0]} />
          <meshNormalMaterial />
        </mesh>
        <Spline
          curvePoints={looping.curvePoints}
          curve={looping.curve}
          showSpline={false}
        ></Spline>
      </group>

      <Float
        speed={5}
        rotationIntensity={0.05}
        floatIntensity={0.2}
        visible={true}
      >
        <group ref={botGroupRef}>
          <primitive ref={botRef} object={model} />
        </group>
      </Float>
      <Spline
        curvePoints={intro.curvePoints}
        curve={intro.curve}
        showSpline={false}
      ></Spline>
    </>
  );
}

useGLTF.preload("/askobot_compressed.glb");
