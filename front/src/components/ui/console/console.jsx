import { useState } from "react";
import "./console.scss";

const Console = ({ isOBS }) => {
  const [level, setLevel] = useState("");
  const [status, setStatus] = useState("");
  const [scene, setScene] = useState("");

  if (isOBS) {
    window.obsstudio.getControlLevel(function (level) {
      setLevel(level);
    });

    window.obsstudio.getStatus(function (status) {
      setStatus(status);
    });

    window.obsstudio.getCurrentScene(function (scene) {
      setScene(scene);
    });
  }

  return (
    <div className="console">
      {isOBS !== null && (
        <div className="obs-status">
          {isOBS ? "Running inside OBS Studio" : "Not running in OBS"}
        </div>
      )}
      {isOBS === true && (
        <div>
          <div>Permission Level: {level}</div>
          <div>
            Status: <pre>{status ? JSON.stringify(status) : "Loading..."}</pre>
          </div>
          <div>
            CurrentScene:{" "}
            <pre>{status ? JSON.stringify(scene) : "Loading..."}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default Console;
