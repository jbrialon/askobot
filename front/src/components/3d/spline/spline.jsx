import { Line } from "@react-three/drei";

export default function Spline({ curvePoints, curve, showSpline }) {
  return (
    <>
      {showSpline && curvePoints.length > 0 && (
        <Line points={curve.getPoints(60)} color="white" lineWidth={2} />
      )}
      {showSpline &&
        curvePoints.map((point, index) => (
          <mesh position={point} scale={0.005} key={index}>
            <sphereGeometry />
            <meshStandardMaterial color="orange" />
          </mesh>
        ))}
    </>
  );
}
