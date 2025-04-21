import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useStore } from "../../../store/store";
import styles from "./start.module.scss";

const Start = () => {
  const scene = useStore((state) => state.scene);
  const isOBS = useStore((state) => state.isOBS);
  const sceneRef = useRef();

  useEffect(() => {
    if (scene === "start" && isOBS) {
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
  }, [scene, isOBS]);

  return (
    <div className={styles["ui-start"]} ref={sceneRef}>
      <div
        className={`${styles["ui-start__text"]} ${styles["ui-start__text--back"]} ${styles["ui-start__text--glitch"]}`}
        data-text="Ça commence bientôt!"
      >
        <span>Ça commence bientôt!</span>
      </div>
      <div
        className={`${styles["ui-start__text"]} ${styles["ui-start__text--front"]} ${styles["ui-start__text--glitch"]}`}
      >
        <span>Ça commence bientôt!</span>
      </div>
    </div>
  );
};

export default Start;
