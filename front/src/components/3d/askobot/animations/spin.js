import { gsap } from "gsap";

export const spinAnimation = (ref, antennas) => {
  if (!ref.current) return;

  const origin = {
    y: ref.current.position.y,
    rotY: ref.current.rotation.y,
  };
  const tl = gsap.timeline({
    paused: true,
  });

  // Step 1: Move slightly down
  tl.to(ref.current.position, {
    y: 0.04,
    duration: 0.25,
    ease: "power1.out",
  });

  // Step 2: Move back up with a bounce
  tl.to(
    ref.current.position,
    {
      y: 0,
      duration: 0.6,
      ease: "bounce.out",
    },
    ">",
  );

  // Step 3: Rotate simultaneously with bounce
  tl.to(
    ref.current.rotation,
    {
      y: origin.rotY + Math.PI * 2,
      duration: 0.75,
      ease: "power2.out",
    },
    0.05, // slightly after the drop starts
  );

  tl.to(
    antennas[0].rotation,
    {
      z: Math.PI * -0.15,
      duration: 0.25,
      ease: "power2.out",
    },
    "<",
  );
  tl.to(
    antennas[1].rotation,
    {
      z: Math.PI * -0.15,
      duration: 0.25,
      ease: "power2.out",
    },
    "<",
  );

  tl.to(
    antennas[0].rotation,
    {
      z: 0,
      delay: 0.5,
      duration: 0.5,
      ease: "power2.out",
    },
    "<",
  );

  tl.to(
    antennas[1].rotation,
    {
      z: 0,
      //delay: 0.05,
      duration: 0.5,
      ease: "power2.out",
    },
    "<",
  );

  // Step 4: Move back to position
  tl.to(ref.current.position, {
    y: 0,
    duration: 1,
    ease: "power1.out",
  });
  tl.to(antennas[0].rotation, {
    z: 0,
    duration: 0.15,
    ease: "power2.out",
  });
  tl.to(antennas[1].rotation, {
    z: 0,
    duration: 0.15,
    ease: "power2.out",
  });

  return tl;
};
