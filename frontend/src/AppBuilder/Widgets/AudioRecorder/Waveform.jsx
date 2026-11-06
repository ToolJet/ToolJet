import React, { useEffect, useRef } from 'react';

const FALLBACK_BAR_COLOR = '#D0D5DD';

// Canvas fillStyle cannot take a `var(--token)` reference, which is what the
// accentColor style holds by default — resolve it against the canvas (the
// wrapper defines/inherits the design tokens) and fall back to the legacy gray.
const resolveBarColor = (canvas, color) => {
  if (!color) return FALLBACK_BAR_COLOR;
  const value = String(color).trim();
  const varMatch = value.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)$/);
  if (!varMatch) return value;
  const resolved = getComputedStyle(canvas).getPropertyValue(varMatch[1]).trim();
  return resolved || (varMatch[2] ? varMatch[2].trim() : FALLBACK_BAR_COLOR);
};

function Waveform({ status, mediaStream, accentColor }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Helper function to draw static line
  const drawStaticLine = (ctx, width, height, barW, gap, bufLen, barColor) => {
    ctx.clearRect(0, 0, width, height);
    const centerY = height / 2;
    const staticBarHeight = 1; // Small static bar height
    let x = 0;

    for (let i = 0; i < bufLen; i++) {
      const yTop = centerY - staticBarHeight;
      const yBottom = centerY;

      ctx.fillStyle = barColor;
      ctx.fillRect(x, yTop, barW, staticBarHeight);
      ctx.fillRect(x, yBottom, barW, staticBarHeight);

      x += barW + gap;
    }
  };

  useEffect(() => {
    if (!['recording', 'paused'].includes(status) || !mediaStream) {
      // Draw static line when not recording/paused or no media stream
      const canvas = canvasRef.current;
      if (canvas) {
        const canvasCtx = canvas.getContext('2d');
        const barWidth = 2;
        const barGap = 3;
        const bufferLength = 32; // 32 for fftSize=64
        const totalWidth = bufferLength * (barWidth + barGap);
        canvas.width = totalWidth;
        drawStaticLine(
          canvasCtx,
          canvas.width,
          canvas.height,
          barWidth,
          barGap,
          bufferLength,
          resolveBarColor(canvas, accentColor)
        );
      }
      return;
    }

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

    const barColor = resolveBarColor(canvas, accentColor);

    // Draw static line when paused
    if (status === 'paused') {
      drawStaticLine(canvasCtx, canvas.width, canvas.height, barWidth, barGap, bufferLength, barColor);
      return () => {
        audioContext.close();
      };
    }

    // When recording, always show bars (minimum height when no audio)
    const draw = () => {
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      let x = 0;
      const centerY = canvas.height / 2;
      const minBarHeight = 1; // Minimum bar height to always show something

      for (let i = 0; i < bufferLength; i++) {
        // Calculate bar height, but ensure it's at least minBarHeight
        const rawHeight = (dataArray[i] / 255) * (canvas.height / 2);
        const barHeight = Math.max(rawHeight, minBarHeight);
        const yTop = centerY - barHeight;
        const yBottom = centerY;

        canvasCtx.fillStyle = barColor;
        canvasCtx.fillRect(x, yTop, barWidth, barHeight);
        canvasCtx.fillRect(x, yBottom, barWidth, barHeight);

        x += barWidth + barGap;
      }

      if (status === 'recording') {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      audioContext.close();
    };
  }, [status, mediaStream, accentColor]);

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
