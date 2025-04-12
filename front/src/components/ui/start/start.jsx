import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import Manager from "../../../classes/manager";
import { useStore } from "../../../store/store";
import "./start.scss";

const Start = () => {
  const scene = useStore((state) => state.scene);
  const sceneRef = useRef();

  useEffect(() => {
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
  }, [scene]);

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
