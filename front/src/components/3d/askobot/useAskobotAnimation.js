import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";

import {
  looping as loopingCurves,
  intro as introCurves,
} from "../spline/curves";
import { ASKOBOT_TRANSFORMS } from "./constants";

export default function useAskobotAnimation(
  ref,
  groupRef,
  scene,
  { wings, antennas, lens, batteries, led },
) {
  const isFirstLoad = useRef(true);

  const dance = () => {
    const origin = {
      x: 0,
      y: 0,
      rotY: ref.current.rotation.y,
      rotZ: ref.current.rotation.z,
    };

    const tl = gsap.timeline();
    // Rotate left + slight bounce
    tl.to(ref.current.rotation, {
      y: origin.rotY - Math.PI * 0.15,
      duration: 0.3,
      ease: "sine.inOut",
    });

    tl.to(
      ref.current.position,
      {
        x: -0.2,
        duration: 0.3,
        ease: "sine.inOut",
      },
      "<",
    );

    tl.to(ref.current.position, {
      y: -0.05,
      duration: 0.15,
      yoyo: true,
      repeat: 3,
      ease: "sine.inOut",
    });

    // Rotate right
    tl.to(ref.current.rotation, {
      y: origin.rotY + Math.PI * 0.15,
      duration: 0.3,
      ease: "sine.inOut",
    });

    tl.to(
      ref.current.position,
      {
        x: 0.2,
        y: 0,
        duration: 0.5,
      },
      "<",
    );

    // Bounce again
    tl.to(ref.current.position, {
      y: -0.05,
      duration: 0.15,
      yoyo: true,
      repeat: 3,
      ease: "sine.inOut",
    });

    // Reset to original rotation
    tl.to(ref.current.rotation, {
      y: origin.rotY,
      z: origin.rotZ,
      duration: 0.5,
    });

    tl.to(
      ref.current.position,
      {
        x: 0,
        y: 0,
        duration: 0.5,
      },
      "<",
    );
  };

  const spin = () => {
    const origin = {
      y: ref.current.position.y,
      rotY: ref.current.rotation.y,
    };
    const tl = gsap.timeline();

    // Step 1: Move slightly down
    tl.to(ref.current.position, {
      y: 0.04,
      duration: 0.25,
      ease: "power1.out",
    });

    // Step 2: Move back up with a bounce
    tl.to(
      ref.current.position,
      {
        y: 0,
        duration: 0.6,
        ease: "bounce.out",
      },
      ">",
    );

    // Step 3: Rotate simultaneously with bounce
    tl.to(
      ref.current.rotation,
      {
        y: origin.rotY + Math.PI * 2,
        duration: 0.75,
        ease: "power2.out",
      },
      0.05, // slightly after the drop starts
    );

    tl.to(
      antennas[0].rotation,
      {
        z: Math.PI * -0.15,
        duration: 0.25,
        ease: "power2.out",
      },
      "<",
    );
    tl.to(
      antennas[1].rotation,
      {
        z: Math.PI * -0.15,
        duration: 0.25,
        ease: "power2.out",
      },
      "<",
    );

    tl.to(
      antennas[0].rotation,
      {
        z: 0,
        delay: 0.5,
        duration: 0.5,
        ease: "power2.out",
      },
      "<",
    );

    tl.to(
      antennas[1].rotation,
      {
        z: 0,
        //delay: 0.05,
        duration: 0.5,
        ease: "power2.out",
      },
      "<",
    );

    // Step 4: Move back to position

    tl.to(ref.current.position, {
      y: 0,
      duration: 1,
      ease: "power1.out",
    });
    tl.to(antennas[0].rotation, {
      z: 0,
      duration: 0.15,
      ease: "power2.out",
    });
    tl.to(antennas[1].rotation, {
      z: 0,
      duration: 0.15,
      ease: "power2.out",
    });
  };

  const excited = () => {
    const tl = gsap.timeline({
      repeat: 1,
    });

    // Step 1: Squash before takeoff
    tl.to(ref.current.scale, {
      y: 0.8,
      x: 1.1,
      z: 1.1,
      duration: 0.1,
      ease: "power1.out",
    });

    // Step 2: Launch upward
    tl.to(
      ref.current.position,
      {
        y: 0.25,
        duration: 0.25,
        ease: "power2.out",
      },
      "<",
    );

    // Step 3: Stretch in air
    tl.to(
      ref.current.scale,
      {
        y: 1.2,
        x: 0.95,
        z: 0.95,
        duration: 0.15,
        ease: "power1.out",
      },
      "<",
    );

    // Step 4: Fall back down
    tl.to(ref.current.position, {
      y: 0,
      duration: 0.3,
      ease: "power2.out",
    });

    // Step 5: Return to original scale
    tl.to(
      ref.current.scale,
      {
        y: 1,
        x: 1,
        z: 1,
        duration: 0.2,
        ease: "power2.out",
      },
      "<",
    );

    return tl;
  };

  const looping = () => {
    if (!ref.current) return;

    const speed = 0.6;
    const values = { property: 0 };
    const origin = {
      rotX: ref.current.rotation.x,
    };

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(ref.current.rotation, {
          x: origin.rotX,
        });
        wiggleAntennas();
        wiggleWings();
        zoom();
      },
    });
    tl.to(ref.current.rotation, {
      x: origin.rotX + Math.PI * -2,
      duration: speed,
      ease: "sine.inOut",
    });
    tl.to(
      values,
      {
        property: 1,
        duration: speed,
        onUpdate: () => {
          const point = loopingCurves.curve.getPointAt(values.property);
          ref.current.position.copy(point);
        },
        ease: "sine.inOut",
      },
      "<",
    );
  };

  const wiggleAntennas = () => {
    antennas.forEach((antenna, index) => {
      const rotX = antenna.rotation.x;
      const tl = gsap.timeline({
        delay: 0.15 * index,
        repeat: 3,
      });
      tl.to(antenna.rotation, {
        x: rotX - Math.PI * 0.15,
        duration: 0.15,
        ease: "sine.inOut",
      });
      tl.to(antenna.rotation, {
        x: rotX,
        duration: 0.15,
        ease: "sine.inOut",
      });
    });
  };

  const wiggleWings = () => {
    wings.forEach((wing, index) => {
      const direction = Math.pow(-1, index);

      const tl = gsap.timeline({
        repeat: 3,
        yoyo: true,
      });

      tl.to(wing.rotation, {
        z: "+=" + direction * Math.PI * 0.15,
        duration: 0.15,
        ease: "sine.inOut",
      });
    });
  };

  const zoom = () => {
    const origin = {
      y: lens[0].position.z,
      rotY: lens[0].rotation.y,
    };
    const tl = gsap.timeline();
    tl.to(lens[0].rotation, {
      y: origin.rotY + Math.PI * 0.15,
      duration: 0.5,
      ease: "power1.inOut",
    });
    tl.to(
      lens[1].scale,
      {
        y: 1.55,
        duration: 0.5,
        ease: "power1.inOut",
      },
      "<",
    );
    tl.to(lens[0].rotation, {
      y: origin.rotY,
      duration: 0.5,
      ease: "power1.inOut",
    });
    tl.to(
      lens[1].scale,
      {
        y: 1,
        duration: 0.5,
        ease: "power1.inOut",
      },
      "<",
    );

    const tlZoom = gsap.timeline();
    const bone = lens[0];
    const originZ = lens[0].position.z;
    tlZoom.to(bone.position, {
      z: bone.position.z + 0.02,
      duration: 0.5,
      ease: "power1.inOut",
    });

    tlZoom.to(bone.position, {
      z: originZ,
      duration: 0.5,
      ease: "power1.inOut",
    });
  };

  // use to debug
  const followCurve = () => {
    animateIntro("live");
  };

  const animateIntro = (scene) => {
    const transform = ASKOBOT_TRANSFORMS[scene] ?? ASKOBOT_TRANSFORMS.default;
    const { rotationY } = transform;

    const values = { property: 0 };
    const speed = 1.0;

    const isForward = scene === "live";

    const tl = gsap.timeline({
      onComplete: () => {
        looping();
        //groupRef.current.position.set(position);
      },
    });

    // Animate along curve
    tl.to(
      values,
      {
        property: 1,
        duration: speed,
        onUpdate: () => {
          const t = values.property;
          const point = isForward
            ? introCurves.curve.getPointAt(t)
            : introCurves.curve.getPointAt(1 - t); // reverse direction
          groupRef.current.position.copy(point);
        },
        ease: "sine.in",
      },
      ">-0.15",
    );

    // Dip again AFTER the curve ends
    tl.to(
      ref.current.position,
      {
        y: -0.05,
        duration: 0.25,
        ease: "sine.inOut",
      },
      ">-0.1",
    );

    // Return to final Y position
    tl.to(ref.current.position, {
      y: 0,
      duration: 0.25,
      ease: "sine.out",
    });

    tl.to(
      groupRef.current.rotation,
      {
        y: rotationY,
        duration: 1,
        ease: "sine.out",
      },
      ">-1",
    );
  };

  const blink = () => {
    const tl = new gsap.timeline({
      repeat: 1,
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
  };

  // update Askobot position based on Scene
  useEffect(() => {
    if (!groupRef.current) return;

    const { position, rotationY } =
      ASKOBOT_TRANSFORMS[scene] ?? ASKOBOT_TRANSFORMS.default;

    // we set the initial position and rotation of the bot depending on the scene on first load,
    // we want to animate it after
    if (isFirstLoad.current) {
      groupRef.current.position.set(position.x, position.y, position.z);
      groupRef.current.rotation.y = rotationY;
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
