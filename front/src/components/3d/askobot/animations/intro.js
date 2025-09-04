import { gsap } from "gsap";
import { intro } from "../../spline/curves";

import { Vector3 } from "three";
export const introAnimation = (scene, botRef, botGroupRef, controlPointGroupRef, controlPointRef) => {
  const values = { property: 0 };
  const speed = 1.0;

  const isForward = scene === "live";

  const tl = gsap.timeline({
    paused: true,
  });

  // Direction vector between current position and destination
  const currentPosition = controlPointGroupRef.current.position;
  const destinationPosition = isForward ? intro.curve.getPointAt(1) : intro.curve.getPointAt(0); // destination is depending on direction of movement
  const direction = new Vector3().subVectors(destinationPosition, currentPosition);

  // calculate the angle
  const lookAtDestinationAngleY = Math.atan2(direction.x, direction.z);

  const cameraDirection = new Vector3().subVectors(
    new Vector3(1.5, 3.3, 3.5), // camera position TODO: get this dynamicly?
    destinationPosition,
  );
  const lookAtCameraAngleY = Math.atan2(cameraDirection.x, cameraDirection.z);
  // look at final destination
  tl.to(botGroupRef.current.rotation, {
    y: lookAtDestinationAngleY,
    duration: 0.55,
    ease: "sine.out",
  });
  // Animate along curve
  tl.to(
    values,
    {
      property: 1,
      duration: speed,
      onUpdate: () => {
        const progress = values.property;
        const point = isForward ? intro.curve.getPointAt(progress) : intro.curve.getPointAt(1 - progress); // reverse direction
        controlPointGroupRef.current.position.copy(point);
      },
      ease: "sine.in",
    },
    ">-0.5",
  );
  // look at camera
  tl.to(botGroupRef.current.rotation, {
    y: lookAtCameraAngleY,
    duration: 0.75,
    ease: "sine.inOut",
  });

  return tl;
};
