import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ analyser, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // To make it smoother, we can interpolate or just draw with rounded caps
    // For now, let's improve the drawing logic to be more fluid
    
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create a gradient
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, '#6366f1'); // Primary
      gradient.addColorStop(1, '#a855f7'); // Secondary

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2; // Scale down slightly

        // Draw curved bars for a more organic look
        ctx.fillStyle = gradient;
        
        // Center the visualization
        const y = (canvas.height - barHeight) / 2;
        
        // Rounded rectangle logic manually for better control or just fillRect with border radius simulated
        // Using simple rects but centered vertically looks cleaner
        if (barHeight > 0) {
           ctx.beginPath();
           ctx.roundRect(x, y, barWidth, barHeight, 4);
           ctx.fill();
        }

        x += barWidth + 2;
      }
    };

    if (isPlaying) {
      draw();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw a gentle idle wave
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isPlaying]);

  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={100} 
      className="w-full h-24 rounded-lg bg-black/40 border border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
    />
  );
};

export default Visualizer;