import React, { useEffect, useRef } from 'react';

function Waveform({ status, mediaStream }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (status !== 'recording' || !mediaStream) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(mediaStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    const bufferLength = analyser.frequencyBinCount; // 32 for fftSize=64
    const dataArray = new Uint8Array(bufferLength);
    source.connect(analyser);

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');

    // adjust canvas width dynamically based on bars
    const barWidth = 2;
    const barGap = 3;
    const totalWidth = bufferLength * (barWidth + barGap);
    canvas.width = totalWidth;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      let x = 0;
      const centerY = canvas.height / 2;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * (canvas.height / 2);
        const yTop = centerY - barHeight;
        const yBottom = centerY;

        canvasCtx.fillStyle = '#D0D5DD';
        canvasCtx.fillRect(x, yTop, barWidth, barHeight);
        canvasCtx.fillRect(x, yBottom, barWidth, barHeight);

        x += barWidth + barGap;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      audioContext.close();
    };
  }, [status, mediaStream]);

  if (['recording', 'paused'].includes(status)) {
    return (
      <canvas
        ref={canvasRef}
        height={40}
        style={{
          marginLeft: '8px',
          alignSelf: 'center',
          borderRadius: '4px',
          background: 'transparent',
        }}
      />
    );
  }

  return null;
}

export default Waveform;
