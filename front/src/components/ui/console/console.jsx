import "./console.scss";

const Console = ({ isOBS }) => {
  return (
    <div className="console">
      {isOBS !== null && (
        <div className="obs-status">
          {isOBS ? "Running inside OBS Studio" : "Not running in OBS"}
        </div>
      )}
    </div>
  );
};

export default Console;
