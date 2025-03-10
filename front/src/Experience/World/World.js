import Experience from "../Experience";
import Askobot from "./Askobot";
import Environment from "./Environment";
import Ground from "./Ground";

export default class World {
  constructor() {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.resources = this.experience.resources;

    // Wait for resources to be loaded
    this.resources.on("ready", () => {
      // Setup
      this.ground = new Ground();
      this.askobot = new Askobot();
      this.environment = new Environment();
    });
  }

  update() {
    // if (this.plane) this.plane.update();
    if (this.ground) this.ground.update();
  }
}
