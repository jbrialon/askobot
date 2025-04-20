import { gsap } from "gsap";
// Three
import {
  MeshPhysicalMaterial,
  ShaderMaterial,
  BackSide,
  Mesh,
  Color,
  Uniform,
} from "three";

// React
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, useAnimations, useGLTF } from "@react-three/drei";
import { useControls, button } from "leva";

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
  const { barColor, barNumber, power } = useControls(
    "Equilizer",
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
  );

  useControls("Bot", {
    spin: button(() => spin()),
    dance: button(() => dance()),
    excited: button(() => excited()),
    zoom: button(() => {
      const origin = {
        z: lens[0].position.z,
      };
      const tl = gsap.timeline();
      tl.to(lens[0].position, {
        z: origin.z + 0.005,
        duration: 0.5,
        ease: "power1.inOut",
      });

      tl.to(lens[0].position, {
        z: origin.z,
        duration: 0.5,
        ease: "power1.inOut",
      });
    }),
  });

  // -----------------------------------------------------------------------------------
  // Model
  // -----------------------------------------------------------------------------------
  const { scene: model } = useGLTF("/models/askobot_led.glb");
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
  model.traverse((child) => {
    if (child instanceof Mesh) {
      if (child.name.includes("Lens00")) {
        child.material = lensMaterial;
      } else if (child.name.includes("Equilizer")) {
        child.material = equilizerMaterial;
      } else if (child.material.name === "Lens") {
        child.material = lensMaterial;
      } else if (child.name === "LED001") {
      } else if (child.name.includes("Battery")) {
        batteries.push(child);
      } else if (child.name === "Lens_Baked") {
        lens.push(child);
      } else if (child.name === "Text003_Baked") {
        lens.push(child);
      }
    }
  });

  // -----------------------------------------------------------------------------------
  // ANIMATIONS
  // -----------------------------------------------------------------------------------
  const dance = () => {
    const origin = {
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
    }
  };

  const onEndedCallback = () => {
    currentAnimation.current = null;
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
      const animation = content.animation;
      playAudio({
        source: audioBuffer,
        volume: 0.3,
        loop: false,
        trim: 0,
        onPlay: () => onPlayCallback(content.animation),
        onEnded: onEndedCallback.bind(animation),
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
      const y = Math.cos(time * speed + offset) * 0.02;
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
