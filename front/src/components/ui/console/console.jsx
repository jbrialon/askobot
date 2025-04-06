import { useState, useEffect } from "react";
import Manager from "../../../classes/manager";
import "./console.scss";

const Console = () => {
  const manager = new Manager();
  const [isOBS, setIsOBS] = useState(false);
  const [level, setLevel] = useState(null);
  const [status, setStatus] = useState(null);
  const [scene, setScene] = useState(null);
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const { isOBS } = manager.getState();
    setIsOBS(isOBS);

    if (isOBS) {
      (async () => {
        const level = await manager.getControlLevelAsync();
        const status = await manager.getStatusAsync();
        const scene = await manager.getCurrentSceneAsync();
        setLevel(level);
        setStatus(status);
        setScene(scene);
      })();
    }

    manager.on("obs-scene-changed", (e) => {
      setScene(e.detail.name);
    });
  }, []);

  return (
    <div className="ui-console">
      {isOBS !== null && (
        <div className="obs-status">
          {isOBS ? "Running inside OBS Studio" : "Not running in OBS"}
        </div>
      )}
      {isOBS === true && (
        <div>
          <div>Pemission Level: {level}</div>
          <div>
            Status: <pre>{status ? JSON.stringify(status) : "Loading..."}</pre>
          </div>
          <div>
            CurrentScene:
            <pre>{scene ? JSON.stringify(scene) : "Loading..."}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default Console;
