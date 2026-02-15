
import React from 'react';

interface VoiceVisualizerProps {
  isPlaying: boolean;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ isPlaying }) => {
  const bars = Array.from({ length: 20 });

  return (
    <div className="flex items-center justify-center gap-1 h-12 py-2">
      {bars.map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-purple-500 rounded-full transition-all duration-200 ${
            isPlaying ? 'animate-pulse' : 'h-1'
          }`}
          style={{
            height: isPlaying ? `${Math.random() * 100}%` : '4px',
            animationDelay: `${i * 0.05}s`,
            animationDuration: isPlaying ? `${0.5 + Math.random()}s` : '0s'
          }}
        />
      ))}
    </div>
  );
};

export default VoiceVisualizer;
