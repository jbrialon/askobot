import { useState } from "react";
import { Line } from "@react-three/drei";
import { curve, curvePoints } from "../splines/curves";

export default function Splines() {
  const [showSplines, setShowSplines] = useState(false);
  return (
    <>
      {showSplines && curvePoints.length > 0 && (
        <Line points={curve.getPoints(300)} color="white" lineWidth={2} />
      )}
      {showSplines &&
        curvePoints.map((point, index) => (
          <mesh position={point} scale={0.05} key={index}>
            <sphereGeometry />
            <meshStandardMaterial color="orange" />
          </mesh>
        ))}
    </>
  );
}
