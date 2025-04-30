import { gsap } from "gsap";

export const danceAnimation = (ref) => {
  if (!ref.current) return;

  const origin = {
    rotY: ref.current.rotation.y,
    rotZ: ref.current.rotation.z,
  };

  const tl = gsap.timeline({ paused: true });

  // Rotate left + slight bounce
  tl.to(ref.current.rotation, {
    y: origin.rotY - Math.PI * 0.15,
    duration: 0.3,
    ease: "sine.inOut",
  });

  tl.to(
    ref.current.position,
    {
      x: -0.2,
      duration: 0.3,
      ease: "sine.inOut",
    },
    "<",
  );

  tl.to(ref.current.position, {
    y: -0.05,
    duration: 0.15,
    yoyo: true,
    repeat: 3,
    ease: "sine.inOut",
  });

  // Rotate right
  tl.to(ref.current.rotation, {
    y: origin.rotY + Math.PI * 0.15,
    duration: 0.3,
    ease: "sine.inOut",
  });

  tl.to(
    ref.current.position,
    {
      x: 0.2,
      y: 0,
      duration: 0.5,
    },
    "<",
  );

  // Bounce again
  tl.to(ref.current.position, {
    y: -0.05,
    duration: 0.15,
    yoyo: true,
    repeat: 3,
    ease: "sine.inOut",
  });

  // Reset to original rotation
  tl.to(ref.current.rotation, {
    y: origin.rotY,
    z: origin.rotZ,
    duration: 0.5,
  });

  tl.to(
    ref.current.position,
    {
      x: 0,
      y: 0,
      duration: 0.5,
    },
    "<",
  );

  return tl;
};
