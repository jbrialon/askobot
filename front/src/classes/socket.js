import { io } from "socket.io-client";

let instance = null;
export default class Socket {
  constructor(channel) {
    // Singleton
    if (instance) {
      return instance;
    }
    instance = this;

    const isDev = import.meta.env.MODE === "development";
    const backendURL = isDev ? "http://localhost:3000" : undefined;

    this.instance = io(backendURL, {
      query: {
        // If window.obsstudio is defined, then it’s running in OBS
        isOBS: (typeof window.obsstudio !== "undefined").toString(),
        // channel is the channel name from the url, it's used to join the socket to the room named after the channel
        channel: channel || "askowbol",
      },
    });
  }
}
