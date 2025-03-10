import * as THREE from "three";
import { gsap } from "gsap";
import Experience from "../Experience";

export default class Askobot {
  constructor() {
    this.experience = new Experience();
    this.debug = this.experience.debug;
    this.scene = this.experience.scene;
    this.time = this.experience.time;
    this.socket = this.experience.socket;

    // Options
    this.options = {
      color: 0x49b3f8,
    };

    // Setup
    this.setMesh();

    this.socket.instance.on("history", (chatHistory) => {
      gsap.to(this.mesh.position, {
        y: "+=1",
        yoyo: true,
        duration: 0.1,
        repeat: 5,
        onComplete: () => {
          this.mesh.position.y = 4;
        },
      });
    });

    // Debug
    this.setDebug();
  }

  setMesh() {
    this.material = new THREE.MeshPhongMaterial({
      color: this.options.color,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), this.material);
    this.mesh.position.y = 4;
    this.mesh.castShadow = true;
    this.scene.add(this.mesh);
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder({
        title: "Askobot",
      });
      this.debugFolder
        .addBinding(this.options, "color", {
          view: "color",
        })
        .on("change", () => {
          this.material.color.set(this.options.color);
        });
    }
  }

  update() {}
}
