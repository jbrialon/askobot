import "./styles/style.scss";

import Experience from "./Experience/Experience.js";
import Socket from "./Socket/Socket.js";

import { createApp, h } from "vue";
import App from "./App.vue";

const app = createApp({
  render: () => h(App),
});

app.mount("#app");

const experience = new Experience({
  targetElement: document.querySelector(".experience"),
  canvas: document.querySelector("canvas.webgl"),
});
const socket = new Socket();
