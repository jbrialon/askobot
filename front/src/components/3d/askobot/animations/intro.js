import { gsap } from "gsap";
import { intro } from "../../spline/curves";
import { ASKOBOT_TRANSFORMS } from "../constants";

export const introAnimation = (scene, ref, groupRef) => {
  const transform = ASKOBOT_TRANSFORMS[scene] ?? ASKOBOT_TRANSFORMS.default;
  const { rotationY } = transform;

  const values = { property: 0 };
  const speed = 1.0;

  const isForward = scene === "live";

  const tl = gsap.timeline({
    paused: true,
  });

  // Animate along curve
  tl.to(
    values,
    {
      property: 1,
      duration: speed,
      onUpdate: () => {
        const progress = values.property;
        const point = isForward
          ? intro.curve.getPointAt(progress)
          : intro.curve.getPointAt(1 - progress); // reverse direction
        groupRef.current.position.copy(point);
      },
      ease: "sine.in",
    },
    ">-0.15",
  );

  // Dip AFTER the curve ends
  tl.to(
    ref.current.position,
    {
      y: -0.05,
      duration: 0.25,
      ease: "sine.inOut",
    },
    ">-0.1",
  );

  // Return to final Y position
  tl.to(ref.current.position, {
    y: 0,
    duration: 0.25,
    ease: "sine.out",
  });

  tl.to(
    groupRef.current.rotation,
    {
      y: rotationY,
      duration: 1,
      ease: "sine.out",
    },
    ">-1",
  );

  return tl;
};
