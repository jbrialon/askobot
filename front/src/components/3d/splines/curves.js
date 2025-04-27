import * as THREE from "three";

export const curvePoints = [
  new THREE.Vector3(0.5, 2.8, 1),
  new THREE.Vector3(0.5, 3.8, 2),
  new THREE.Vector3(0.5, 4.8, 1),
  new THREE.Vector3(0.5, 3.8, 0),
  new THREE.Vector3(0.5, 2.8, 1),
];

export const curve = new THREE.CatmullRomCurve3(curvePoints);
