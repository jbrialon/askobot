import { gsap } from "gsap";

export const excitedAnimation = (ref) => {
  if (!ref.current) return;

  const tl = gsap.timeline({
    repeat: 1,
    paused: true,
  });

  // Step 1: Squash before takeoff
  tl.to(ref.current.scale, {
    y: 0.8,
    x: 1.1,
    z: 1.1,
    duration: 0.1,
    ease: "power1.out",
  });

  // Step 2: Launch upward
  tl.to(
    ref.current.position,
    {
      y: 0.25,
      duration: 0.25,
      ease: "power2.out",
    },
    "<",
  );

  // Step 3: Stretch in air
  tl.to(
    ref.current.scale,
    {
      y: 1.2,
      x: 0.95,
      z: 0.95,
      duration: 0.15,
      ease: "power1.out",
    },
    "<",
  );

  // Step 4: Fall back down
  tl.to(ref.current.position, {
    y: 0,
    duration: 0.3,
    ease: "power2.out",
  });

  // Step 5: Return to original scale
  tl.to(
    ref.current.scale,
    {
      y: 1,
      x: 1,
      z: 1,
      duration: 0.2,
      ease: "power2.out",
    },
    "<",
  );

  return tl;
};
