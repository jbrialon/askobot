import { Pane } from "tweakpane";

let instance = null;
export default class Debug {
  constructor() {
    // Singleton
    if (instance) {
      return instance;
    }
    instance = this;

    if (!this.ui) {
      this.ui = new Pane({ title: "Parameters" });
    }
  }
}
