import { gsap } from "gsap";
import { looping } from "@/components/3d/spline/curves";
import soundEvents from "@/classes/sound-events";
export const loopingAnimation = (botRef, controlPointRef, wings) => {
  if (!botRef.current) return;

  const values = { property: 0 };
  const origin = {
    rotX: botRef.current.rotation.x,
  };

  const tl = gsap.timeline({
    paused: true,
    onStart: () => {
      soundEvents.play("whoosh", {
        volume: 0.5,
        rate: 0.6,
        delay: 0.1,
      });
    },
    onComplete: () => {
      gsap.set(botRef.current.rotation, {
        x: origin.rotX,
      });
    },
  });
  tl.to(botRef.current.rotation, {
    x: origin.rotX + Math.PI * -2,
    duration: 1,
    ease: "sine.inOut",
  });
  tl.to(
    values,
    {
      property: 1,
      duration: 0.6,
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
        duration: 0.5,
        ease: "sine.inOut",
      },
      "<",
    );

    wingsTimeline.to(wing.rotation, {
      z: rotZ,
      duration: 0.5,
      ease: "sine.inOut",
    });

    tl.add(wingsTimeline, 0); // 0 means they start at the same time
  });

  return tl;
};
