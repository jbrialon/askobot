import { useEffect, useRef } from "react";

import { gsap } from "gsap";

import Manager from "../../../classes/manager";
import "./start.scss";

const Start = () => {
  const manager = new Manager();
  const sceneRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      const scene = e.detail.name;
      if (scene === "start") {
        gsap.to(sceneRef.current, {
          autoAlpha: 1,
          duration: 1.5,
          ease: "power1.inOut",
          delay: 1.5,
        });
      } else {
        gsap.to(sceneRef.current, {
          autoAlpha: 0,
          duration: 1.5,
          ease: "power1.inOut",
        });
      }
    };
    manager.on("obs-scene-changed", handler);

    return () => manager.off("obs-scene-changed", handler);
  }, [manager]);

  return (
    <div className="ui-start" ref={sceneRef}>
      <div className="text text-back glitch" data-text="Ça commence bientôt!">
        <span>Ça commence bientôt!</span>
      </div>
      <div className="text text-front glitch">
        <span>Ça commence bientôt!</span>
      </div>
    </div>
  );
};

export default Start;
