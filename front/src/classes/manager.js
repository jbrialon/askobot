import Socket from "./socket.js";
import { useStore } from "../store/store.js";

let instance = null;
export default class Manager extends EventTarget {
  constructor() {
    super();
    if (instance) {
      return instance;
    }
    instance = this;
    this.socket = new Socket().instance;
    this.isOBS = null;

    this.initOBS();
    this.initOBSEvents();
    this.initSocketEvents();

    if (this.isOBS) {
      this.syncCurrentScene();
    }
  }

  initSocketEvents() {
    this.addEventListener("bot-askAskobot", (e) => {
      const { username, message } = e.detail;
      const user = {
        name: username,
        color: "#ff00ff",
      };
      this.socket.emit("bot-askAskobot", user, message);
    });

    this.addEventListener("bot-reactToEvent", (e) => {
      const { eventType, data } = e.detail;

      this.socket.emit("bot-reactToEvent", eventType, data);
    });

    this.socket.on("chat-history", (history) => {
      this.dispatchEvent(new CustomEvent("chat-history", { detail: history }));
    });

    this.socket.on("audio-voice", (data) => {
      this.dispatchEvent(new CustomEvent("audio-voice", { detail: data }));
    });
  }

  initOBS() {
    this.isOBS = typeof window.obsstudio !== "undefined";
    useStore.getState().setIsOBS(this.isOBS);
  }

  initOBSEvents() {
    if (this.isOBS) {
      window.addEventListener("obsSceneChanged", (event) => {
        const data = {
          sceneName: event.detail.name,
        };

        // emit event to bot so he can react to
        // this.socket.emit("bot-reactToEvent", {
        //   eventType: "scene-change",
        //   data,
        // });

        // update store
        useStore.getState().setScene(data.sceneName);
      });
    } else {
      // dev mode
      useStore.getState().setScene("start");
    }
  }

  async syncCurrentScene() {
    const scene = await this.getCurrentSceneAsync();
    if (scene && scene.name) {
      useStore.getState().setScene(scene.name);
    }
  }

  getCurrentSceneAsync() {
    return new Promise((resolve) => {
      window.obsstudio.getCurrentScene((scene) => resolve(scene));
    });
  }

  trigger(eventName, detail) {
    this.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  on(eventName, callback) {
    this.addEventListener(eventName, callback);
  }

  off(eventName, callback) {
    this.removeEventListener(eventName, callback);
  }
}
