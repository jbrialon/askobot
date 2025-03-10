import * as THREE from "three";
import Experience from "../Experience";

export default class Ground {
  constructor() {
    this.experience = new Experience();
    this.debug = this.experience.debug;
    this.scene = this.experience.scene;
    this.time = this.experience.time;

    // Options
    this.options = {
      color: 0x77c6f9,
    };

    // Setup
    this.setMesh();
    this.setGrid();

    // Debug
    this.setDebug();
  }

  setMesh() {
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2000, 2000),
      new THREE.MeshPhongMaterial({
        color: this.options.color,
        depthWrite: false,
      }),
    );
    this.mesh.rotation.x = -Math.PI / 2;
    this.scene.add(this.mesh);
  }

  setGrid() {
    this.grid = new THREE.GridHelper(200, 40, 0xffffff, 0xffffff);
    this.grid.material.opacity = 0.2;
    this.grid.material.transparent = true;
    this.scene.add(this.grid);
  }

  setDebug() {
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder({
        title: "Ground",
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
