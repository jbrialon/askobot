import { io } from "socket.io-client";

let instance = null;
export default class Socket {
  constructor() {
    // Singleton
    if (instance) {
      return instance;
    }
    instance = this;

    const isDev = import.meta.env.MODE === "development";
    const backendURL = isDev ? "http://localhost:3000" : undefined;

    this.instance = io(backendURL);
  }
}
