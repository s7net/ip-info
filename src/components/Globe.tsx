import { useEffect, useRef } from "react";
import createGlobe from "cobe";

export function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    let phi = 0;
    let width = 0;
    let raf = 0;
    const onResize = () => {
      if (canvasRef.current) width = canvasRef.current.offsetWidth;
    };
    window.addEventListener("resize", onResize);
    onResize();

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.25,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.05, 0.15, 0.16],
      markerColor: [0.15, 0.85, 0.78],
      glowColor: [0.06, 0.35, 0.35],
      markers: [],
    });

    const tick = () => {
      phi += 0.003;
      globe.update({ phi, width: width * 2, height: width * 2 });
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
      className="pointer-events-none fixed inset-0 -z-10 flex items-center justify-center overflow-hidden"
      aria-hidden
    >
      <div className="relative aspect-square w-[min(140vh,140vw)] max-w-none opacity-60">
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", contain: "layout paint size" }}
        />
      </div>
    </div>
  );
}