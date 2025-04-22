import { gsap } from "gsap";
// Three
import {
  MeshPhysicalMaterial,
  ShaderMaterial,
  BackSide,
  Mesh,
  Bone,
  Color,
  Uniform,
  DoubleSide,
} from "three";

// React
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, useGLTF } from "@react-three/drei";
import { useControls, button, folder } from "leva";

// App
import Manager from "../../classes/manager";
import vertexShader from "./../../shaders/vertex.glsl";
import fragmentShader from "./../../shaders/fragment.glsl";
import { useAudioPlayer } from "./../../composables/useAudioPlayer";

// Store
import { useStore } from "../../store/store";

const ASKOBOT_TRANSFORMS = {
  live: {
    position: { x: 1.5, y: 2.7, z: -1 },
    rotationY: 0,
  },
  default: {
    position: { x: 0.5, y: 2.8, z: 1 },
    rotationY: Math.PI * 0.07,
  },
};

export default function Askobot() {
  const manager = new Manager();
  const scene = useStore((state) => state.scene);
  const isFirstLoad = useRef(true);
  const askobotRef = useRef();
  const currentAnimation = useRef(null);

  // -----------------------------------------------------------------------------------
  // Debug
  // -----------------------------------------------------------------------------------
  const { barColor, barNumber, power } = useControls("Bot", {
    Animations: folder({
      spin: button(() => spin()),
      dance: button(() => dance()),
      excited: button(() => excited()),
      looping: button(() => looping()),
      "Wiggle Antennas": button(() => wiggleAntennas()),
      "Wiggle Wings": button(() => {
        wings.forEach((wing, index) => {
          const direction = Math.pow(-1, index);

          const tl = gsap.timeline({
            repeat: 3,
            yoyo: true, // makes it go back automatically
          });

          // animate relative to current rotation, using gsap's "+=" syntax
          tl.to(wing.rotation, {
            z: "+=" + direction * Math.PI * 0.15,
            duration: 0.15,
            ease: "sine.inOut",
          });
        });
      }),
      zoom: button(() => {
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
            y: 0.7,
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
      }),
    }),
    Equilizer: folder(
      {
        barNumber: {
          value: 10,
          step: 1,
          min: 2,
          max: 60,
        },
        barColor: "#3ddfff",
        power: {
          value: 15,
          step: 0.1,
          min: 1,
          max: 20,
        },
      },
      {
        collapsed: true,
      },
    ),
  });

  // -----------------------------------------------------------------------------------
  // Model
  // -----------------------------------------------------------------------------------
  const { scene: model } = useGLTF("/models/askobot_compressed.glb");
  const { analysis, playAudio } = useAudioPlayer();

  // -----------------------------------------------------------------------------------
  // MATERIALS
  // -----------------------------------------------------------------------------------
  const lensMaterial = new MeshPhysicalMaterial({
    metalness: 0.9,
    roughness: 0.05,
    envMapIntensity: 0.9,
    clearcoat: 1,
    transparent: true,
    opacity: 0.5,
    reflectivity: 0.2,
    ior: 0.9,
    color: 0xf0f0f0,
    side: BackSide,
  });

  const equilizerMaterial = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        side: DoubleSide,
        uniforms: {
          uTime: new Uniform(0),
          uIntensity: new Uniform(0),
          uBarNumber: new Uniform(barNumber),
          uBarColor: new Uniform(new Color(barColor)),
        },
        vertexShader,
        fragmentShader,
      }),
    [],
  );

  const batteries = [];
  const lens = [];
  const lensMesh = [];
  const wings = [];
  const antennas = [];
  model.traverse((child) => {
    if (child instanceof Mesh) {
      if (child.name.includes("Lens00")) {
        child.material = lensMaterial;
      } else if (child.name.includes("Equilizer")) {
        child.material = equilizerMaterial;
      } else if (child.material.name === "Lens") {
        child.material = lensMaterial;
        lensMesh.push(child);
      } else if (child.name === "LED001") {
      } else if (child.name.includes("Battery")) {
        batteries.push(child);
      } else if (child.name === "Lens_Baked") {
        lensMesh.push(child);
      } else if (child.name === "Text003_Baked") {
        lensMesh.push(child);
      }
    }
    if (child instanceof Bone) {
      // Wings
      if (child.name === "Bone011") {
        wings.push(child);
      } else if (child.name === "Bone012") {
        wings.push(child);
      }
      // Antennas
      if (child.name === "Bone005") {
        antennas.push(child);
      } else if (child.name === "Bone006") {
        antennas.push(child);
      }
      // Lens
      if (child.name === "Bone009") {
        lens.push(child);
      } else if (child.name === "Bone010") {
        // glass
        lens.push(child);
      }
    }
  });

  // -----------------------------------------------------------------------------------
  // ANIMATIONS
  // -----------------------------------------------------------------------------------
  const dance = () => {
    const origin = {
      x: askobotRef.current.position.x,
      y: askobotRef.current.position.y,
      rotY: askobotRef.current.rotation.y,
      rotZ: askobotRef.current.rotation.z,
    };

    const tl = gsap.timeline();
    // Rotate left + slight bounce
    tl.to(askobotRef.current.rotation, {
      y: origin.rotY - Math.PI * 0.15,
      duration: 0.3,
      ease: "sine.inOut",
    });

    tl.to(
      askobotRef.current.position,
      {
        x: origin.x - 0.2,
        duration: 0.3,
        ease: "sine.inOut",
      },
      "<",
    );

    tl.to(askobotRef.current.position, {
      y: origin.y - 0.05,
      duration: 0.15,
      yoyo: true,
      repeat: 3,
      ease: "sine.inOut",
    });

    // Rotate right
    tl.to(askobotRef.current.rotation, {
      y: origin.rotY + Math.PI * 0.15,
      duration: 0.3,
      ease: "sine.inOut",
    });

    tl.to(
      askobotRef.current.position,
      {
        x: origin.x + 0.2,
        y: origin.y,
        duration: 0.5,
      },
      "<",
    );

    // Bounce again
    tl.to(askobotRef.current.position, {
      y: origin.y - 0.05,
      duration: 0.15,
      yoyo: true,
      repeat: 3,
      ease: "sine.inOut",
    });

    // Reset to original rotation
    tl.to(askobotRef.current.rotation, {
      y: origin.rotY,
      z: origin.rotZ,
      duration: 0.5,
    });

    tl.to(
      askobotRef.current.position,
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
      y: askobotRef.current.position.y,
      rotY: askobotRef.current.rotation.y,
    };
    const tl = gsap.timeline();

    // Step 1: Move slightly down
    tl.to(askobotRef.current.position, {
      y: origin.y - 0.04,
      duration: 0.25,
      ease: "power1.out",
    });

    // Step 2: Move back up with a bounce
    tl.to(
      askobotRef.current.position,
      {
        y: origin.y,
        duration: 0.6,
        ease: "bounce.out",
      },
      ">",
    );

    // Step 3: Rotate simultaneously with bounce
    tl.to(
      askobotRef.current.rotation,
      {
        y: origin.rotY + Math.PI * 2,
        duration: 0.75,
        ease: "power2.out",
      },
      0.05, // slightly after the drop starts
    );

    // Step 4: Move back to position
    const { position } =
      ASKOBOT_TRANSFORMS[scene] ?? ASKOBOT_TRANSFORMS.default;
    tl.to(askobotRef.current.position, {
      y: position.y,
      duration: 1,
      ease: "power1.out",
    });
  };

  const excited = () => {
    const origin = {
      y: askobotRef.current.position.y,
      scaleY: askobotRef.current.scale.y,
    };

    const tl = gsap.timeline({
      repeat: 1,
    });

    // Step 1: Squash before takeoff
    tl.to(askobotRef.current.scale, {
      y: 0.8,
      x: 1.1,
      z: 1.1,
      duration: 0.1,
      ease: "power1.out",
    });

    // Step 2: Launch upward
    tl.to(
      askobotRef.current.position,
      {
        y: origin.y + 0.25,
        duration: 0.25,
        ease: "power2.out",
      },
      "<",
    );

    // Step 3: Stretch in air
    tl.to(
      askobotRef.current.scale,
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
    tl.to(askobotRef.current.position, {
      y: origin.y,
      duration: 0.3,
      ease: "power2.out",
    });

    // Step 5: Return to original scale
    tl.to(
      askobotRef.current.scale,
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
    const origin = {
      position: askobotRef.current.position,
      rotX: askobotRef.current.rotation.x,
    };

    const amplitude = 3.5;
    const totalTime = 0.5;
    gsap.to(askobotRef.current.rotation, {
      x: origin.rotX + Math.PI * -2,
      duration: totalTime,
      ease: "sine.inOut",
      onComplete: () => {
        gsap.set(askobotRef.current.rotation, {
          x: origin.rotX,
        });
      },
    });

    const tl = gsap.timeline();
    tl.to(askobotRef.current.position, {
      y: origin.position.y + 0.1 * amplitude,
      z: origin.position.z + 0.1 * amplitude,
      duration: totalTime / 4,
      ease: "power1.in",
    });

    tl.to(askobotRef.current.position, {
      y: origin.position.y + 0.2 * amplitude,
      z: origin.position.z,
      duration: totalTime / 4,
      ease: "none",
    });

    tl.to(askobotRef.current.position, {
      y: origin.position.y + 0.1 * amplitude,
      z: origin.position.z - 0.2 * amplitude,
      duration: totalTime / 4,
      ease: "none",
    });

    tl.to(askobotRef.current.position, {
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

  // Wiggle Bones
  // const helper = new WiggleRigHelper({
  //   skeleton: scene.getObjectByName("Stick").skeleton,
  //   dotSize: 0.2,
  //   lineWidth: 0.02,
  // });

  // -----------------------------------------------------------------------------------
  // AUDIO CALLBACKS
  // -----------------------------------------------------------------------------------
  const onPlayCallback = (animation) => {
    console.log("onPlayCallback animation:", animation);
    currentAnimation.current = animation;
    if (animation === "dance") {
      dance();
    } else if (animation === "spin") {
      spin();
    } else if (animation === "excited") {
      excited();
    } else if (animation === "looping") {
      looping();
    }
  };

  const onEndedCallback = (animation) => {
    currentAnimation.current = null;
    wiggleAntennas();
  };

  // -----------------------------------------------------------------------------------
  // HOOKS
  // -----------------------------------------------------------------------------------
  useEffect(() => {
    equilizerMaterial.uniforms.uBarNumber.value = barNumber;
    equilizerMaterial.uniforms.uBarColor.value.set(barColor);
  }, [barNumber, barColor, equilizerMaterial]);

  // Voice data
  useEffect(() => {
    const handler = (e) => {
      const { audioBuffer, user, content } = e.detail;
      playAudio({
        source: audioBuffer ? audioBuffer : "/audio/error.mp3",
        volume: 0.3,
        loop: false,
        trim: 0,
        detune: Math.floor(Math.random() * 121) - 60,
        onPlay: () => onPlayCallback(content.animation),
        onEnded: () => {
          onEndedCallback(content.animation);
        },
      });
    };
    manager.on("voice-data", handler);

    return () => manager.off("voice-data", handler);
  }, []);

  // update askobot position based on Scene
  useEffect(() => {
    if (!askobotRef.current) return;

    const { position, rotationY } =
      ASKOBOT_TRANSFORMS[scene] ?? ASKOBOT_TRANSFORMS.default;

    // we set the initial position and rotation of the bot depending on the scene on first load,
    // we want to animate it after
    if (isFirstLoad.current) {
      askobotRef.current.position.set(position.x, position.y, position.z);
      askobotRef.current.rotation.y = rotationY;
      isFirstLoad.current = false;
    } else {
      gsap.to(askobotRef.current.position, {
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

      gsap.to(askobotRef.current.rotation, {
        y: rotationY,
        duration: 1.75,
        ease: "elastic.out",
        delay: 2.25,
      });
    }
  }, [scene]);

  // Dance Intro animation (TODO: Enhance)
  useEffect(() => {
    let rotationTween = null;

    const handler = (e) => {
      const analysis = Math.pow(e.detail * 0.85, 8);

      if (analysis > 0.0225) {
        if (rotationTween && rotationTween.isActive()) return;

        rotationTween = gsap.to(askobotRef.current.rotation, {
          x: Math.PI * analysis,
          duration: 0.25,
          repeat: 1,
          yoyo: true,
          ease: "power1.inOut",
        });
      }
    };
    manager.on("start-audio", handler);

    return () => manager.off("start-audio", handler);
  }, [manager]);

  // -----------------------------------------------------------------------------------
  // Update Loop
  // -----------------------------------------------------------------------------------
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const speed = 12;

    // Battery position update
    batteries.forEach((battery, index) => {
      const offset = index * 3;
      const y = Math.cos(time * speed + offset) * 0.02 - 0.13;
      battery.position.y = y;
    });

    // Talking animation
    if (askobotRef.current && currentAnimation.current === "talk") {
      const raw = Math.pow(analysis * 0.85, power);
      const strength = Math.min(1, Math.log10(raw * 1000 + 1));

      const { position } =
        ASKOBOT_TRANSFORMS[scene] ?? ASKOBOT_TRANSFORMS.default;

      const amp = 0.01;
      const rotAmp = 0.05;

      askobotRef.current.position.y =
        position.y + Math.sin(time * 30) * amp * strength;
      askobotRef.current.rotation.x = Math.sin(time * 20) * rotAmp * strength;
    }

    equilizerMaterial.uniforms.uIntensity.value = Math.pow(
      analysis * 0.85,
      power,
    );
  });

  return (
    <Float speed={5} rotationIntensity={0.05} floatIntensity={0.2}>
      <primitive ref={askobotRef} object={model} />
    </Float>
  );
}

useGLTF.preload("/askobot_compressed.glb");
