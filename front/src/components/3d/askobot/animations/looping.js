import { gsap } from "gsap";
import { looping } from "../../spline/curves";

export const loopingAnimation = (botRef, controlPointRef) => {
  if (!botRef.current) return;

  const speed = 0.6;
  const values = { property: 0 };
  const origin = {
    rotX: botRef.current.rotation.x,
  };

  const tl = gsap.timeline({
    paused: true,
    onComplete: () => {
      gsap.set(botRef.current.rotation, {
        x: origin.rotX,
      });
    },
  });
  tl.to(botRef.current.rotation, {
    x: origin.rotX + Math.PI * -2,
    duration: 1,
    ease: "sine.inOut",
  });
  tl.to(
    values,
    {
      property: 1,
      duration: speed,
      onUpdate: () => {
        const point = looping.curve.getPointAt(values.property);
        controlPointRef.current.position.copy(point);
      },
      ease: "sine.inOut",
    },
    "<",
  );

  return tl;
};
