import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../stores/game.store";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function CrashGraph({ multiplier, crashed }: { multiplier: number; crashed: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (multiplier <= 1.01) {
      pointsRef.current = [];
      startTimeRef.current = Date.now();
    }
  }, [multiplier <= 1.01]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const pad = { top: 16, right: 16, bottom: 28, left: 36 };

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    pointsRef.current.push({ x: elapsed, y: multiplier });

    const points = pointsRef.current;
    const maxX = Math.max(points[points.length - 1]?.x ?? 1, 1);
    const maxY = Math.max(points.reduce((m, p) => Math.max(m, p.y), 1), multiplier, 1.5);

    const toCanvas = (x: number, y: number) => ({
      cx: pad.left + (x / maxX) * (W - pad.left - pad.right),
      cy: H - pad.bottom - ((y - 1) / (maxY - 1)) * (H - pad.top - pad.bottom),
    });

    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (i / 4) * (H - pad.top - pad.bottom);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();
      const val = maxY - ((i / 4) * (maxY - 1));
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText(val.toFixed(1) + "x", pad.left - 4, y + 3);
    }

    if (points.length < 2) return;

    const grad = ctx.createLinearGradient(0, pad.top, 0, H - pad.bottom);
    if (crashed) {
      grad.addColorStop(0, "rgba(239,68,68,0.4)");
      grad.addColorStop(1, "rgba(239,68,68,0.02)");
    } else {
      grad.addColorStop(0, "rgba(168,85,247,0.4)");
      grad.addColorStop(1, "rgba(168,85,247,0.02)");
    }

    ctx.beginPath();
    const first = toCanvas(points[0].x, points[0].y);
    ctx.moveTo(first.cx, H - pad.bottom);
    ctx.lineTo(first.cx, first.cy);
    for (let i = 1; i < points.length; i++) {
      const { cx, cy } = toCanvas(points[i].x, points[i].y);
      ctx.lineTo(cx, cy);
    }
    const last = toCanvas(points[points.length - 1].x, points[points.length - 1].y);
    ctx.lineTo(last.cx, H - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(first.cx, first.cy);
    for (let i = 1; i < points.length; i++) {
      const { cx, cy } = toCanvas(points[i].x, points[i].y);
      ctx.lineTo(cx, cy);
    }
    ctx.strokeStyle = crashed ? "#ef4444" : "#a855f7";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(last.cx, last.cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = crashed ? "#ef4444" : "#a855f7";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  return <canvas ref={canvasRef} width={600} height={180} className="w-full h-full" />;
}

function Skeleton() {
  return (
    <Card className="overflow-hidden" style={{ height: "260px" }}>
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-24 h-4 bg-gray-800 rounded animate-pulse" />
        <div className="w-32 h-16 bg-gray-800 rounded animate-pulse" />
      </div>
    </Card>
  );
}

export function MultiplierDisplay() {
  const { multiplier, status, secondsLeft, hydrated } = useGameStore();
  const crashed = status === "crashed";
  const [crashAnim, setCrashAnim] = useState(false);
  const prevStatus = useRef(status);

  useEffect(() => {
    if (prevStatus.current !== "crashed" && status === "crashed") {
      setCrashAnim(true);
      setTimeout(() => setCrashAnim(false), 800);
    }
    prevStatus.current = status;
  }, [status]);

  if (!hydrated) return <Skeleton />;

  return (
    <>
      <style>{`
        @keyframes crash-shake {
          0%   { transform: translate(0,0) scale(1); }
          15%  { transform: translate(-6px, 3px) scale(1.03); }
          30%  { transform: translate(6px, -3px) scale(1.03); }
          45%  { transform: translate(-4px, 2px) scale(1.01); }
          60%  { transform: translate(4px, -2px) scale(1.01); }
          75%  { transform: translate(-2px, 1px); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes crash-flash {
          0%   { opacity: 0; }
          20%  { opacity: 0.35; }
          100% { opacity: 0; }
        }
        .crash-shake { animation: crash-shake 0.8s ease-out; }
        .crash-flash { animation: crash-flash 0.8s ease-out; }
      `}</style>
      <Card
        className={cn(
          "relative overflow-hidden",
          crashed ? "border-red-800" : "border-gray-700",
          crashAnim && "crash-shake",
        )}
        style={{ height: "260px" }}
      >
        {crashAnim && (
          <div className="crash-flash absolute inset-0 bg-red-600 z-10 rounded-2xl pointer-events-none" />
        )}

        {status === "betting" ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p className="text-gray-400 text-lg">Fase de apostas</p>
            <p className="text-yellow-400 text-6xl font-bold">{secondsLeft}s</p>
          </div>
        ) : (
          <>
            <div className="absolute inset-0 px-2 pt-2 pb-8">
              <CrashGraph multiplier={multiplier} crashed={crashed} />
            </div>
            <div className="absolute bottom-3 left-0 right-0 flex flex-col items-center pointer-events-none">
              <p className={cn("text-sm font-bold mb-0.5", crashed ? "text-red-400" : "text-gray-400")}>
                {crashed ? "💥 CRASHED" : "🚀 AO VIVO"}
              </p>
              <p className={cn("text-5xl font-black drop-shadow-lg", crashed ? "text-red-500" : "text-purple-400")}>
                {multiplier.toFixed(2)}x
              </p>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
