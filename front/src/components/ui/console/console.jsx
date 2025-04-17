import { useStore } from "../../../store/store";
import styles from "./console.module.scss";

const Console = () => {
  const [scene, isOBS] = useStore((state) => [state.scene, state.isOBS]);

  return (
    <div className={styles["ui-console"]}>
      {isOBS !== null && (
        <div className={styles["ui-console__status"]}>
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
