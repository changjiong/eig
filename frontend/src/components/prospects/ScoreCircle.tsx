import { useEffect, useRef } from "react";

interface ScoreCircleProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export default function ScoreCircle({
  score,
  size = 60,
  strokeWidth = 4,
}: ScoreCircleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Function to determine color based on score
  const getScoreColor = (value: number) => {
    if (value >= 90) return "#059669"; // emerald-600
    if (value >= 75) return "#0891b2"; // cyan-600
    if (value >= 60) return "#2563eb"; // blue-600
    if (value >= 40) return "#d97706"; // amber-600
    return "#dc2626"; // red-600
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size - strokeWidth) / 2;
    
    // Draw background circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "#e2e8f0"; // slate-200
    ctx.lineWidth = strokeWidth;
    ctx.stroke();

    // Calculate score angle
    const scorePercentage = score / 100;
    const startAngle = -0.5 * Math.PI; // Start at top
    const endAngle = startAngle + scorePercentage * 2 * Math.PI;

    // Draw score arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = getScoreColor(score);
    ctx.lineWidth = strokeWidth;
    ctx.stroke();

    // Draw text
    ctx.fillStyle = getScoreColor(score);
    ctx.font = `bold ${size / 3}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(score.toString(), centerX, centerY);
  }, [score, size, strokeWidth]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="inline-block"
    />
  );
}