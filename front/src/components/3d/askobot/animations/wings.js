import { gsap } from "gsap";

export const wingsAnimation = (wings) => {
  const tl = gsap.timeline({
    paused: true,
  });

  wings.forEach((wing, index) => {
    const direction = Math.pow(-1, index);
    const rotZ = wing.rotation.z;

    const wingsTimeline = gsap.timeline({
      repeat: 3,
      yoyo: true,
    });

    wingsTimeline.to(wing.rotation, {
      z: rotZ + direction * Math.PI * 0.15,
      duration: 0.15,
      ease: "sine.inOut",
    });

    tl.add(wingsTimeline, 0); // 0 means they start at the same time
  });

  return tl;
};
