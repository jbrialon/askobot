import { OrbitControls, PerspectiveCamera } from "@react-three/drei";

export default function Camera() {
  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={35}
        near={0.1}
        far={1000}
        position={[1.5, 3.3, 3.5]}
      />

      <OrbitControls makeDefault target={[0, 2.7, 0]} />
    </>
  );
}
