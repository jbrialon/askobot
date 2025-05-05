import { gsap } from "gsap";
import { looping } from "../../spline/curves";

export const loopingAnimation = (botRef, controlPointRef, wings) => {
  if (!botRef.current) return;

  const speed = 0.6;
  const random = Math.floor(1 + Math.random());

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
    duration: 1 * random,
    ease: "sine.inOut",
  });
  tl.to(
    values,
    {
      property: 1,
      duration: speed * random,
      onUpdate: () => {
        const point = looping.curve.getPointAt(values.property);
        controlPointRef.current.position.copy(point);
      },
      ease: "sine.inOut",
    },
    "<",
  );

  wings.forEach((wing, index) => {
    const direction = Math.pow(-1, index);
    const rotZ = wing.rotation.z;

    const wingsTimeline = gsap.timeline();

    wingsTimeline.to(
      wing.rotation,
      {
        z: rotZ + Math.PI * 0.3 * direction,
        duration: (1 * random) / 2,
        ease: "sine.inOut",
      },
      "<",
    );

    wingsTimeline.to(wing.rotation, {
      z: rotZ,
      duration: (1 * random) / 2,
      ease: "sine.inOut",
    });

    tl.add(wingsTimeline, 0); // 0 means they start at the same time
  });

  return tl;
};
