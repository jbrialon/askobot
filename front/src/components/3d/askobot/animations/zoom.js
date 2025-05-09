import { gsap } from "gsap";
import soundEvents from "../../../../classes/sound-events";
export const zoomAnimation = (lens) => {
  const origin = {
    y: lens[0].position.z,
    rotY: lens[0].rotation.y,
  };

  const tl = gsap.timeline({
    onStart: () => {
      soundEvents.play("zoom", {
        volume: 0.3,
      });
    },
    paused: true,
  });

  const lensTimeline = gsap.timeline();
  lensTimeline.to(lens[0].rotation, {
    y: origin.rotY + Math.PI * 0.15,
    duration: 0.5,
    ease: "power1.inOut",
  });
  // scale optics for zoom effect
  lensTimeline.to(
    lens[1].scale,
    {
      y: 1.55,
      duration: 0.5,
      ease: "power1.inOut",
    },
    "<",
  );

  // Lens rotation
  lensTimeline.to(lens[0].rotation, {
    y: origin.rotY,
    duration: 0.4,
    ease: "power1.inOut",
  });
  lensTimeline.to(
    lens[1].scale,
    {
      y: 1,
      duration: 0.4,
      ease: "power1.inOut",
    },
    "<",
  );

  const zoomTimeline = gsap.timeline();
  const bone = lens[0];
  const originZ = lens[0].position.z;
  // Lens position
  zoomTimeline.to(bone.position, {
    z: bone.position.z + 0.02,
    duration: 0.4,
    ease: "power1.inOut",
  });

  zoomTimeline.to(bone.position, {
    z: originZ,
    duration: 0.4,
    ease: "power1.inOut",
  });

  tl.add(lensTimeline, 0);
  tl.add(zoomTimeline, 0);

  return tl;
};
