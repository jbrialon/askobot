import { useState, useEffect } from "react";
import Manager from "../../../classes/manager";
import { useStore } from "../../../store/store";
import "./console.scss";

const Console = () => {
  const scene = useStore((state) => state.scene);
  const isOBS = useStore((state) => state.isOBS);

  return (
    <div className="ui-console">
      {isOBS !== null && (
        <div className="obs-status">
          {isOBS ? "Running inside OBS Studio" : "Not running in OBS"}
        </div>
      )}
      {isOBS === true && (
        <div>
          {/* <div>Pemission Level: {level}</div> */}
          <div>
            {/* Status: <pre>{status ? JSON.stringify(status) : "Loading..."}</pre> */}
          </div>
          <div>
            CurrentScene:
            <pre>{scene ? scene : "Loading..."}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default Console;
