import TitleScreenOverlay from "../components/TitleScreenOverlay";

interface TitleScreenProps {
  onPlay: () => void;
  onWatchIntro?: () => void;
}

export default function TitleScreen({ onPlay, onWatchIntro }: TitleScreenProps) {
  return <TitleScreenOverlay onStartMatch={onPlay} onWatchIntro={onWatchIntro} />;
}
