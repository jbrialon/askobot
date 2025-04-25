import { useControls, folder, button } from "leva";

export default function useAskobotControls(animations) {
  const { spin, dance, excited, looping, wiggleAntennas, wiggleWings, zoom } =
    animations;

  const controls = useControls("Bot", {
    Animations: folder({
      spin: button(() => spin()),
      dance: button(() => dance()),
      excited: button(() => excited()),
      looping: button(() => looping()),
      "Wiggle Antennas": button(() => wiggleAntennas()),
      "Wiggle Wings": button(() => wiggleWings()),
      zoom: button(() => zoom()),
    }),
    Equilizer: folder(
      {
        barNumber: { value: 10, step: 1, min: 2, max: 60 },
        barColor: "#3ddfff",
        power: { value: 15, step: 0.1, min: 1, max: 20 },
      },
      { collapsed: true },
    ),
  });

  const { barNumber, barColor, power } = controls;

  return {
    barNumber,
    barColor,
    power,
  };
}
