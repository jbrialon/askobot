// Three
import { Color, Vector3, Object3D } from "three";

// React
import { useEffect, useRef, useMemo } from "react";
import { Float, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

// App
import Manager from "@/classes/manager";
import useAskobotModel from "./useAskobotModel";
import useAskobotMaterials from "./useAskobotMaterials";
import useAskobotAnimation from "./useAskobotAnimation";
import useAskobotAudio from "./useAskobotAudio";
import useAskobotControls from "./useAskobotControls";

// Store
import { useStore } from "@/store/store";

// Curves
import { looping, intro, talkToCamera } from "../spline/curves";

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
  const { model, batteries, lens, lensMesh, wings, antennas, led, equilizer } = useAskobotModel();

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
    manager,
  );
  // Leva Controls
  const { barNumber, barColor, ledColor } = useAskobotControls(animations);
  // Materials
  const { lensMaterial, equalizerMaterial, ledMaterial } = useAskobotMaterials(barNumber, barColor, ledColor);

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

  // const leftWingBaseZ = useRef();
  // const rightWingBaseZ = useRef();

  // useEffect(() => {
  //   if (wings[0]) leftWingBaseZ.current = wings[0].rotation.z;
  //   if (wings[1]) rightWingBaseZ.current = wings[1].rotation.z;
  // }, [wings]);

  // update loop to sync the position of the control point to the model with fake physics
  useFrame(() => {
    if (!botGroupRef.current) return;

    const bot = botGroupRef.current;
    const control = controlPointRef.current;
    if (!bot || !control) return;

    const pos = bot.position;
    const target = new Vector3();
    // the control point is inside a group so his local position is 0,0,0
    // so we want its world position
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

    // const maxTilt = 20;
    // const tiltAmount = MathUtils.clamp(velocity.current.x * maxTilt, -0.4, 0.4);

    // // LEFT WING
    // if (wings[0] && leftWingBaseZ.current !== undefined) {
    //   const base = leftWingBaseZ.current;
    //   const target = base - tiltAmount;
    //   console.log("tiltAmount", tiltAmount, target);
    //   wings[0].rotation.z = MathUtils.lerp(wings[0].rotation.z, target, 1);
    // }

    // // RIGHT WING
    // if (wings[1] && rightWingBaseZ.current !== undefined) {
    //   const base = rightWingBaseZ.current;
    //   const target = base - tiltAmount * -1;
    //   wings[1].rotation.z = MathUtils.lerp(wings[1].rotation.z, target, 1);
    // }
  });

  return (
    <>
      <group ref={controlPointGroupRef} position={controlPointGroupRef.current.position}>
        <mesh ref={controlPointRef} scale={[0.5, 0.8, 0.5]} visible={false}>
          <octahedronGeometry args={[0.1, 0]} />
          <meshNormalMaterial />
        </mesh>
        <Spline curvePoints={looping.curvePoints} curve={looping.curve} showSpline={false}></Spline>
      </group>

      <Float speed={5} rotationIntensity={0.05} floatIntensity={0.5} visible={true}>
        <group ref={botGroupRef}>
          <primitive ref={botRef} object={model} />
        </group>
      </Float>
      <Spline curvePoints={intro.curvePoints} curve={intro.curve} showSpline={false}></Spline>
      <Spline curvePoints={talkToCamera.curvePoints} curve={talkToCamera.curve} showSpline={false}></Spline>
    </>
  );
}

useGLTF.preload("/askobot_compressed.glb");
