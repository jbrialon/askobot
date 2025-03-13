import { io } from "socket.io-client";

let instance = null;
export default class Socket {
  constructor() {
    // Singleton
    if (instance) {
      return instance;
    }
    instance = this;

    this.instance = io();
  }
}
