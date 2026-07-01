import { useEffect, useRef } from "react";
import createGlobe from "cobe";

export function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let phi = 0;
    let width = canvas.offsetWidth || 600;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const onResize = () => {
      if (canvas.offsetWidth) width = canvas.offsetWidth;
    };
    window.addEventListener("resize", onResize);
    onResize();

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: width * dpr,
      height: width * dpr,
      phi: 0,
      theta: 0.25,
      dark: 1,
      diffuse: 3,
      mapSamples: 16000,
      mapBrightness: 8,
      baseColor: [0.3, 0.9, 0.85],
      markerColor: [0.2, 1, 0.9],
      glowColor: [0.15, 0.7, 0.65],
      markers: [],
    });

    const tick = () => {
      phi += 0.003;
      globe.update({ phi, width: width * dpr, height: width * dpr });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 flex items-end justify-center overflow-hidden"
      aria-hidden
    >
      <div className="relative aspect-square w-[min(160vh,140vw)] translate-y-1/2 opacity-70">
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", contain: "layout paint size" }}
        />
      </div>
    </div>
  );
}