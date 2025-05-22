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
      <group
        visible={false}
        position={[1.5, 3.3, 3.5]}
        rotation={[-Math.PI / 20, Math.PI / 10, 0]}
      >
        {/* Main camera body */}
        <mesh>
          <boxGeometry args={[0.15, 0.15, 0.25]} />
          <meshStandardMaterial color="black" />
        </mesh>

        {/* Camera lens */}
        <mesh
          position={[0, 0, -0.15]}
          rotation={[0, Math.PI / 2, -Math.PI / 2]}
        >
          <cylinderGeometry args={[0.1, 0.03, 0.25, 16]} />
          <meshStandardMaterial color="grey" />
        </mesh>

        {/* Camera Film x2 */}
        <mesh position={[0, 0.14, 0.1]} rotation={[-90, 0, -190]}>
          <cylinderGeometry args={[0.09, 0.09, 0.04, 16]} />
          <meshStandardMaterial color="black" />
        </mesh>

        <mesh position={[0, 0.14, -0.08]} rotation={[-90, 0, -190]}>
          <cylinderGeometry args={[0.09, 0.09, 0.04, 16]} />
          <meshStandardMaterial color="black" />
        </mesh>
      </group>
      <OrbitControls makeDefault target={[0, 2.7, 0]} />
    </>
  );
}
