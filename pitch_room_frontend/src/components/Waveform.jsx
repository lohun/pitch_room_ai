import React, { useEffect, useRef } from 'react';

const Waveform = ({ isActive }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    
    const bars = 40;
    const barWidth = 3;
    const gap = 2;
    
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00f2ff';
      
      for (let i = 0; i < bars; i++) {
        const height = Math.random() * canvas.height * 0.8 + 5;
        const x = i * (barWidth + gap);
        const y = (canvas.height - height) / 2;
        
        ctx.fillRect(x, y, barWidth, height);
      }
      
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [isActive]);

  return (
    <canvas 
      ref={canvasRef} 
      width={200} 
      height={40} 
      style={{ opacity: isActive ? 1 : 0.2, transition: 'opacity 0.3s' }}
    />
  );
};

export default Waveform;
