import "./style.scss";
import Tres from "@tresjs/core";
import { createApp } from "vue";
import App from "./App.vue";

import Socket from "./Socket/Socket.js";
const socket = new Socket();

export const app = createApp(App);

app.use(Tres);
app.mount("#app");
