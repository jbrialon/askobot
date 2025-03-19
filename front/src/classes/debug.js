import { Pane } from "tweakpane";

let instance = null;
export default class Debug {
  constructor() {
    // Singleton
    if (instance) {
      return instance;
    }
    instance = this;

    this.active = window.location.hash === "#debug";

    // if (this.active) {
    this.ui = new Pane({ title: "Parameters" });
    // }
  }
}
