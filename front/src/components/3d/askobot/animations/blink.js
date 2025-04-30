import { gsap } from "gsap";

export const blinkAnimation = (led) => {
  const tl = new gsap.timeline({
    repeat: 1,
    paused: true,
  });

  tl.to(led.material, {
    opacity: 0.25,
    duration: 0.25,
    ease: "power4.inOut",
  });

  tl.to(led.material, {
    opacity: 1,
    duration: 0.25,
    ease: "power4.inOut",
  });

  return tl;
};
