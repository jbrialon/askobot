import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { curve, curvePoints } from "../splines/curves";
import { ASKOBOT_TRANSFORMS } from "./constants";

export default function useAskobotAnimation(
  ref,
  scene,
  curve,
  { wings, antennas, lens, batteries, led },
) {
  const isFirstLoad = useRef(true);

  const dance = () => {
    const origin = {
      x: ref.current.position.x,
      y: ref.current.position.y,
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
        x: origin.x - 0.2,
        duration: 0.3,
        ease: "sine.inOut",
      },
      "<",
    );

    tl.to(ref.current.position, {
      y: origin.y - 0.05,
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
        x: origin.x + 0.2,
        y: origin.y,
        duration: 0.5,
      },
      "<",
    );

    // Bounce again
    tl.to(ref.current.position, {
      y: origin.y - 0.05,
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
        x: origin.x,
        y: origin.y,
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
      y: origin.y - 0.04,
      duration: 0.25,
      ease: "power1.out",
    });

    // Step 2: Move back up with a bounce
    tl.to(
      ref.current.position,
      {
        y: origin.y,
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
    const { position } =
      ASKOBOT_TRANSFORMS[scene] ?? ASKOBOT_TRANSFORMS.default;
    tl.to(ref.current.position, {
      y: position.y,
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
    const origin = {
      y: ref.current.position.y,
      scaleY: ref.current.scale.y,
    };

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
        y: origin.y + 0.25,
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
      y: origin.y,
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

    const origin = {
      position: ref.current.position,
      rotX: ref.current.rotation.x,
    };

    const amplitude = 3.5;
    const totalTime = 0.5;
    gsap.to(ref.current.rotation, {
      x: origin.rotX + Math.PI * -2,
      duration: totalTime,
      ease: "sine.inOut",
      onComplete: () => {
        gsap.set(ref.current.rotation, {
          x: origin.rotX,
        });
      },
    });

    const tl = gsap.timeline();
    tl.to(ref.current.position, {
      y: origin.position.y + 0.1 * amplitude,
      z: origin.position.z + 0.1 * amplitude,
      duration: totalTime / 4,
      ease: "power1.in",
    });

    tl.to(ref.current.position, {
      y: origin.position.y + 0.2 * amplitude,
      z: origin.position.z,
      duration: totalTime / 4,
      ease: "none",
    });

    tl.to(ref.current.position, {
      y: origin.position.y + 0.1 * amplitude,
      z: origin.position.z - 0.2 * amplitude,
      duration: totalTime / 4,
      ease: "none",
    });

    tl.to(ref.current.position, {
      y: origin.position.y,
      z: origin.position.z,
      duration: totalTime / 4,
      ease: "power1.out",
    });
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

  const followCurve = () => {
    const values = { property: 0 };

    const origin = {
      position: ref.current.position,
      rotX: ref.current.rotation.x,
    };

    const totalTime = 1;
    gsap.to(ref.current.rotation, {
      x: origin.rotX + Math.PI * -2,
      duration: totalTime,
      ease: "sine.inOut",
      onComplete: () => {
        gsap.set(ref.current.rotation, {
          x: origin.rotX,
        });
      },
    });

    gsap.to(values, {
      property: 1,
      duration: totalTime,
      onUpdate: () => {
        const point = curve.getPointAt(values.property);
        ref.current.position.copy(point);
      },
      ease: "none",
    });
  };

  const blink = () => {
    const tl = new gsap.timeline({
      repeat: 1,
    });
    console.log(led);
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
    if (!ref.current) return;

    const { position, rotationY } =
      ASKOBOT_TRANSFORMS[scene] ?? ASKOBOT_TRANSFORMS.default;

    // we set the initial position and rotation of the bot depending on the scene on first load,
    // we want to animate it after
    if (isFirstLoad.current) {
      ref.current.position.set(position.x, position.y, position.z);
      ref.current.rotation.y = rotationY;
      isFirstLoad.current = false;
    } else {
      gsap.to(ref.current.position, {
        x: position.x,
        y: position.y,
        z: position.z,
        duration: 1.5,
        ease: "power2.inOut",
        delay: 1,
        onComplete: () => {
          looping();
        },
      });

      gsap.to(ref.current.rotation, {
        y: rotationY,
        duration: 1.75,
        ease: "elastic.out",
        delay: 2.25,
      });
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
