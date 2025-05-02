import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";

// Animations
import { danceAnimation } from "./animations/dance";
import { spinAnimation } from "./animations/spin";
import { excitedAnimation } from "./animations/excited";
import { loopingAnimation } from "./animations/looping";
import { antennasAnimation } from "./animations/antennas";
import { wingsAnimation } from "./animations/wings";
import { zoomAnimation } from "./animations/zoom";
import { introAnimation } from "./animations/intro";
import { blinkAnimation } from "./animations/blink";

// Constants
import { ASKOBOT_TRANSFORMS } from "./constants";

export default function useAskobotAnimation(
  botRef,
  botGroupRef,
  controlPointGroupRef,
  controlPointRef,
  scene,
  { wings, antennas, lens, batteries, led },
) {
  const isFirstLoad = useRef(true);

  const dance = () => {
    const danceTimeline = danceAnimation(botRef);
    danceTimeline.play();
  };

  const spin = () => {
    const spinTimeline = spinAnimation(botRef, antennas);
    spinTimeline.play();
  };

  const excited = () => {
    const excitedTimeline = excitedAnimation(botRef);
    excitedTimeline.play();
  };

  const looping = () => {
    const loopingTimeline = loopingAnimation(botRef, controlPointRef);
    loopingTimeline.play().then(() => {
      wiggleAntennas();
      wiggleWings();
      zoom();
    });
  };

  const wiggleAntennas = () => {
    const antennasTimeline = antennasAnimation(antennas);
    antennasTimeline.play();
  };

  const wiggleWings = () => {
    const wingsTimeline = wingsAnimation(wings);
    wingsTimeline.play();
  };

  const zoom = () => {
    const zoomTimeline = zoomAnimation(lens);
    zoomTimeline.play();
  };

  const animateIntro = (scene) => {
    const introTimeline = introAnimation(
      scene,
      botRef,
      botGroupRef,
      controlPointGroupRef,
      controlPointRef,
    );
    introTimeline.play().then(() => {
      wiggleAntennas();
      wiggleWings();
      zoom();
    });
  };

  const blink = () => {
    const blinkTimeline = blinkAnimation(led);
    blinkTimeline.play();
  };

  // use to debug
  const followCurve = () => {
    animateIntro("live");
  };

  // update Askobot position based on Scene
  useEffect(() => {
    if (!controlPointGroupRef.current) return;

    const { position, rotationY } =
      ASKOBOT_TRANSFORMS[scene] ?? ASKOBOT_TRANSFORMS.default;

    // we set the initial position and rotation of the bot depending on the scene on first load,
    // we want to animate it after
    // TODO : I think we don't need the rotation anymore
    if (isFirstLoad.current) {
      controlPointGroupRef.current.position.set(
        position.x,
        position.y,
        position.z,
      );
      botGroupRef.current.rotation.y = rotationY;
      isFirstLoad.current = false;
    } else {
      animateIntro(scene);
    }
  }, [scene]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const speed = 12;

    // Battery position update
    batteries.forEach((battery, index) => {
      const offset = index * 3;
      const y = Math.cos(time * speed + offset) * 0.02 - 0.13;
      battery.position.y = y;
    });
  });

  return {
    dance,
    spin,
    excited,
    looping,
    wiggleAntennas,
    wiggleWings,
    zoom,
    followCurve,
    blink,
  };
}
