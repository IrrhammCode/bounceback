import { useState, useCallback } from "react";
import TitleScreen from "./screens/TitleScreen";
import GameScreen from "./screens/GameScreen";
import ResultScreen from "./screens/ResultScreen";
import { initAudio } from "./game/audio";

type Screen = "title" | "game" | "result";

interface ResultData {
  winner: number;
  scores: [number, number];
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("title");
  const [result, setResult] = useState<ResultData>({
    winner: 0,
    scores: [0, 0],
  });

  const handlePlay = useCallback(() => {
    initAudio();
    setScreen("game");
  }, []);

  const handleMatchEnd = useCallback(
    (winner: number, scores: [number, number]) => {
      setResult({ winner, scores });
      setScreen("result");
    },
    []
  );

  const handleRematch = useCallback(() => {
    setScreen("game");
  }, []);

  const handleMenu = useCallback(() => {
    setScreen("title");
  }, []);

  switch (screen) {
    case "title":
      return <TitleScreen onPlay={handlePlay} />;
    case "game":
      return (
        <GameScreen
          key={Date.now()}
          onMatchEnd={handleMatchEnd}
          onExit={handleMenu}
        />
      );
    case "result":
      return (
        <ResultScreen
          winner={result.winner}
          scores={result.scores}
          onRematch={handleRematch}
          onMenu={handleMenu}
        />
      );
  }
}
