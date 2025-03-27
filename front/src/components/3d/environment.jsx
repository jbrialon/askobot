import { Suspense } from "react";
import { Environment } from "@react-three/drei";

export default function Env() {
  return (
    <>
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <ambientLight intensity={0.8} />
      <Suspense>
        <Environment files="/textures/large_corridor_1k.hdr" />
      </Suspense>
    </>
  );
}
