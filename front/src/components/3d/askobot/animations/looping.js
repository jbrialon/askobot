import { gsap } from "gsap";
import { looping } from "../../spline/curves";

export const loopingAnimation = (ref) => {
  if (!ref.current) return;

  const speed = 0.6;
  const values = { property: 0 };
  const origin = {
    rotX: ref.current.rotation.x,
  };

  const tl = gsap.timeline({
    paused: true,
    onComplete: () => {
      gsap.set(ref.current.rotation, {
        x: origin.rotX,
      });
    },
  });
  tl.to(ref.current.rotation, {
    x: origin.rotX + Math.PI * -2,
    duration: speed,
    ease: "sine.inOut",
  });
  tl.to(
    values,
    {
      property: 1,
      duration: speed,
      onUpdate: () => {
        const point = looping.curve.getPointAt(values.property);
        ref.current.position.copy(point);
      },
      ease: "sine.inOut",
    },
    "<",
  );

  return tl;
};
