import Miku from "Miku";

interface AnimatedBackgroundProps {
  ballPosition: { x: number; y: number };
}

export default function AnimatedBackground({ ballPosition }: AnimatedBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-20 left-10 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
      <div className="absolute top-40 right-20 w-1 h-1 bg-cyan-400 rounded-full animate-ping"></div>
      <div className="absolute bottom-32 left-1/4 w-1 h-1 bg-pink-400 rounded-full animate-bounce"></div>
      <div 
        className="absolute w-3 h-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-lg transition-all duration-4000 ease-in-out" 
        style={{ 
          left: `${ballPosition.x}%`, 
          top: `${ballPosition.y}%`, 
          transform: "translate(-50%, -50%)" 
        }}
      ></div>
    </div>
  );
}
