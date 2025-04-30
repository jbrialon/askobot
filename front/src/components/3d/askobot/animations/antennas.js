import { gsap } from "gsap";

export const antennasAnimation = (antennas) => {
  const tl = gsap.timeline({
    paused: true,
  });

  antennas.forEach((antenna, index) => {
    const rotX = antenna.rotation.x;
    const antennaTimeline = gsap.timeline({
      delay: 0.15 * index,
      repeat: 3,
    });
    antennaTimeline.to(antenna.rotation, {
      x: rotX - Math.PI * 0.15,
      duration: 0.15,
      ease: "sine.inOut",
    });
    antennaTimeline.to(antenna.rotation, {
      x: rotX,
      duration: 0.15,
      ease: "sine.inOut",
    });

    tl.add(antennaTimeline, 0); // 0 means they start at the same time
  });

  return tl;
};
