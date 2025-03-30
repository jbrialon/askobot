import Socket from "./socket.js";

let instance = null;
export default class Manager extends EventTarget {
  constructor() {
    super();
    // Singleton
    if (instance) {
      return instance;
    }
    instance = this;
    this.socket = new Socket().instance;
    this.state = {
      isOBS: null,
    };

    // init Events
    this.initOBS();
    this.initSocketEvents();
  }

  initSocketEvents() {
    this.addEventListener("ask-gpt", (e) => {
      const { nickname, question } = e.detail;
      this.socket.emit("ask-gpt", nickname, question);
    });

    this.socket.on("history", (history) => {
      this.dispatchEvent(new CustomEvent("history", { detail: history }));
    });

    this.socket.on("voice-data", (data) => {
      this.dispatchEvent(new CustomEvent("voice-data", { detail: data }));
    });
  }

  initOBS() {
    if (typeof window.obsstudio !== "undefined") {
      this.state.isOBS = true;
    } else {
      this.state.isOBS = false;
    }
  }

  getControlLevelAsync() {
    return new Promise((resolve) => {
      window.obsstudio.getControlLevel((level) => {
        resolve(level);
      });
    });
  }

  getStatusAsync() {
    return new Promise((resolve) => {
      window.obsstudio.getStatus((status) => {
        resolve(status);
      });
    });
  }

  getCurrentSceneAsync() {
    return new Promise((resolve) => {
      window.obsstudio.getCurrentScene((scene) => {
        resolve(scene);
      });
    });
  }

  getState() {
    return {
      isOBS: this.state.isOBS,
    };
  }

  setState(partial) {
    this.state = {
      ...this.state,
      ...partial,
    };
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
