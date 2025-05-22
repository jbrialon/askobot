import { Vector3, CatmullRomCurve3, CubicBezierCurve3 } from "three";
import { ASKOBOT_TRANSFORMS } from "../askobot/constants";

// Looping
const curvePoints = [];
const radius = 0.4;
const step = 15; // every 15 degrees
for (let i = 0; i <= 360; i++) {
  if (i % step === 0) {
    const angle = (i * Math.PI) / 180 - Math.PI / 2; // Offset by -90 degrees, we want the circle to start at the lowest point
    curvePoints.push(
      new Vector3(
        0,
        Math.sin(angle) * radius + radius, // + radius so the lowest point is at the center of the model
        Math.cos(angle) * radius,
      ),
    );
  }
}

export const looping = {
  curvePoints,
  curve: new CatmullRomCurve3(curvePoints),
};

const { position } = ASKOBOT_TRANSFORMS["live"];

const start = new Vector3(0.5, 2.8, 1);
const end = new Vector3(position.x, position.y, position.z);

// Control points make it "bulge" into an oval shape
const control1 = new Vector3(0.5, position.y + 0.5, 0);
const control2 = new Vector3(1.5, position.y + 0.7, 0);

export const intro = {
  curvePoints: [start, control1, control2, end],
  curve: new CubicBezierCurve3(start, control1, control2, end),
};

const cameraPos = new Vector3(1.5, 3.3, 3.5);
const endCameraPos = new Vector3(
  cameraPos.x,
  cameraPos.y - 0.25,
  cameraPos.z - 1,
);
const controlTalkToCamera1 = new Vector3(0.5, position.y - 0.5, 0);
const controlTalkToCamera2 = new Vector3(1.5, position.y - 0.7, 0);

export const talkToCamera = {
  curvePoints: [end, cameraPos],
  curve: new CubicBezierCurve3(
    end,
    controlTalkToCamera1,
    controlTalkToCamera2,
    endCameraPos,
  ),
};
