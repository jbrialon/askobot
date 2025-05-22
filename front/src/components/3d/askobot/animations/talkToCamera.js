import { gsap } from "gsap";
import { talkToCamera } from "../../spline/curves";

export const talkToCameraAnimation = (controlPointGroupRef, zoom, manager) => {
  if (!controlPointGroupRef.current) return;

  const tl = gsap.timeline({
    paused: true,
  });
  const values = { property: 0 };

  tl.to(values, {
    property: 1,
    duration: 0.75,
    onUpdate: () => {
      const point = talkToCamera.curve.getPointAt(values.property);
      controlPointGroupRef.current.position.copy(point);
    },
    ease: "sine.inOut",
    onComplete: () => {
      zoom();
      manager.trigger("bot-reactToEvent", {
        eventType: "action-talkToCamera",
      });
    },
  });
  tl.to(values, {
    property: 1,
    duration: 1,
    delay: 10,
    onUpdate: () => {
      const point = talkToCamera.curve.getPointAt(1 - values.property);
      controlPointGroupRef.current.position.copy(point);
    },
    ease: "sine.inOut",
  });

  return tl;
};
