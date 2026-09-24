import TitleScreenOverlay from "../components/TitleScreenOverlay";

interface TitleScreenProps {
  onPlay: () => void;
}

export default function TitleScreen({ onPlay }: TitleScreenProps) {
  return <TitleScreenOverlay onStartMatch={onPlay} />;
}
