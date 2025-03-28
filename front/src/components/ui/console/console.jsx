import { useState } from "react";
import "./console.scss";

const Console = ({ isOBS }) => {
  const [level, setLevel] = useState(null);
  const [status, setStatus] = useState(null);
  const [scene, setScene] = useState(null);

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
      <div>Level: {level}</div>
      <div>
        Status: <pre>{status ? JSON.stringify(status) : "Loading..."}</pre>
      </div>
      <div>
        CurrentScene: <pre>{status ? JSON.stringify(scene) : "Loading..."}</pre>
      </div>

      {isOBS !== null && (
        <div className="obs-status">
          {isOBS ? "Running inside OBS Studio" : "Not running in OBS"}
        </div>
      )}
    </div>
  );
};

export default Console;
