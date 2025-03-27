<script>
import * as THREE from "three";
import { TresCanvas } from "@tresjs/core";
import { EffectComposerPmndrs, BloomPmndrs } from "@tresjs/post-processing";
import { Grid } from "@tresjs/cientos";

// Components
import Camera from "./camera.vue";
import Environment from "./environment.vue";
import Askobot from "./askobot.vue";

// THREE
THREE.ColorManagement.enabled = true;

// Debug
const debugObject = {
  fields: {
    nickname: "Jérémy",
    question: "yo askobot, la forme?",
  },
  panes: {
    nickname: null,
    input: null,
    button: null,
  },
  setDebug: (ui, socket) => {
    debugObject.panes.nickname = ui.addBinding(debugObject.fields, "nickname");
    debugObject.panes.input = ui.addBinding(debugObject.fields, "question");
    debugObject.panes.button = ui
      .addButton({
        title: "Ask",
      })
      .on("click", () => {
        socket.emit(
          "ask-gpt",
          debugObject.fields.nickname,
          debugObject.fields.question,
        );
      });
  },
  removeDebug: () => {
    debugObject.panes.nickname.dispose();
    debugObject.panes.input.dispose();
    debugObject.panes.button.dispose();
  },
};

export default {
  name: "Experience",
  props: {
    socket: {
      required: true,
      type: Object,
    },
    debug: {
      required: true,
      type: Object,
    },
  },
  components: {
    TresCanvas,
    Camera,
    Environment,
    Askobot,
    Grid,
    EffectComposerPmndrs,
    BloomPmndrs,
  },
  data() {
    return {
      gl: {
        shadows: false,
        alpha: true,
        outputColorSpace: THREE.SRGBColorSpace,
        toneMapping: THREE.NoToneMapping,
        toneMappingExposure: 1,
        powerPreference: "high-performance",
        dpr: Math.min(window.devicePixelRatio, 2),
      },
      debugObject: {
        question: "what can you tell me about you?",
      },
      debugPanes: {
        input: null,
        button: null,
      },
    };
  },
  methods: {},
  mounted() {
    debugObject.setDebug(this.debug.ui, this.socket.instance);
  },
  beforeUnmount() {
    debugObject.removeDebug();
  },
};

// Debug
// const state = reactive({
//   radius: 2,
//   intensity: 1.5,
//   luminanceThreshold: 0.95,
//   luminanceSmoothing: 0.025,
// });

// props.debug.ui.addBinding(state, "radius", {
//   min: 0,
//   max: 10,
//   step: 0.001,
// });

// props.debug.ui.addBinding(state, "intensity", {
//   min: 0,
//   max: 10,
//   step: 0.001,
// });

// props.debug.ui.addBinding(state, "luminanceThreshold", {
//   min: 0,
//   max: 1,
//   step: 0.001,
// });

// props.debug.ui.addBinding(state, "luminanceSmoothing", {
//   min: 0,
//   max: 1,
//   step: 0.001,
// });
</script>

<template>
  <TresCanvas v-bind="gl">
    <Camera></Camera>
    <Environment></Environment>
    <Suspense>
      <Askobot :socket="socket" :debug="debug"></Askobot>
    </Suspense>
    <Grid
      :args="[200, 100]"
      cell-color="#ffffff"
      :cell-size="0.5"
      :cell-thickness="0.5"
      section-color="#f0f0f0"
      :section-size="2"
      :section-thickness="1.3"
      :infinite-grid="true"
      :fade-from="0"
      :fade-distance="20"
      :fade-strength="1"
    ></Grid>
    <!-- <TresMesh :position-y="2" :scale="[0.05, 0.05, 0.05]">
      <TresSphereGeometry :args="[]" />
      <TresMeshStandardMaterial
        color="blue"
        emissive="orange"
        :emissiveIntensity="10"
      />
    </TresMesh> -->
    <!-- <EffectComposerPmndrs>
      <BloomPmndrs
        :radius="state.radius"
        :intensity="state.intensity"
        :luminance-threshold="state.luminanceThreshold"
        :luminance-smoothing="state.luminanceSmoothing"
        mipmap-blur
      />
    </EffectComposerPmndrs> -->
  </TresCanvas>
</template>
