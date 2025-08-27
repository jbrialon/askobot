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
    this.isOBS = null;

    this.initOBS();
    this.initOBSEvents();

    if (this.isOBS) {
      this.syncCurrentScene();
    }

    useStore.subscribe(({ channel }) => {
      this.initSocketEvents(channel);
    });
  }

  initSocketEvents(channel) {
    this.socket = new Socket(channel).instance;

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

        // disabled for now
        // update store
        // useStore.getState().setScene(data.sceneName);
      });
    } else {
      // dev mode
      // useStore.getState().setScene("start");
    }
  }

  async syncCurrentScene() {
    const scene = await this.getCurrentSceneAsync();
    if (scene && scene.name) {
      // useStore.getState().setScene(scene.name);
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
