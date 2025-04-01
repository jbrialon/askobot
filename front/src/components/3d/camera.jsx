import { useEffect, useRef } from "react";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { gsap } from "gsap";

import Manager from "../../classes/manager";

export default function camera() {
  const manager = new Manager();
  const controlsRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      const scene = e.detail.name;

      if (scene === "live") {
        gsap.to(controlsRef.current.target, {
          x: -2,
          duration: 1.5,
          ease: "power1.inOut",
        });
      } else {
        gsap.to(controlsRef.current.target, {
          x: 0,
          duration: 1.5,
          ease: "power1.inOut",
        });
      }
    };
    manager.on("obs-scene-changed", handler);

    return () => manager.off("obs-scene-changed", handler);
  }, [manager]);

  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={35}
        near={0.1}
        far={1000}
        position={[1.5, 3, 3.5]}
      />

      <OrbitControls ref={controlsRef} makeDefault target={[0, 2.7, 0]} />
    </>
  );
}
