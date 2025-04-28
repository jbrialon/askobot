import { useState } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";

export default function Splines({ curvePoints, curve }) {
  const [showSplines, setShowSplines] = useState(true);
  // if (!position) return null;

  return (
    <>
      {showSplines && curvePoints.length > 0 && (
        <Line points={curve.getPoints(300)} color="white" lineWidth={2} />
      )}
      {showSplines &&
        curvePoints.map((point, index) => (
          <mesh position={point} scale={0.005} key={index}>
            <sphereGeometry />
            <meshStandardMaterial color="orange" />
          </mesh>
        ))}
    </>
  );
}
