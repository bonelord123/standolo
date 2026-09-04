"use client";

export default function BottleOverlay() {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      
      {/* Digitális standoló */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative h-[70vh] w-[45vw] max-w-[260px] min-w-[180px]">

          {/* Palack kontúr */}
          <div className="absolute inset-0 rounded-[35%] border-2 border-white/80">
            <div className="absolute left-1/2 top-0 h-[15%] w-[35%] -translate-x-1/2 rounded-t-full border-x-2 border-t-2 border-white/80" />
          </div>

          {/* Skála */}
          <div className="absolute -right-16 top-0 flex h-full flex-col justify-between text-sm font-bold text-white">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>

          {/* Vízszintes beosztások */}
          {[0, 25, 50, 75, 100].map((value) => (
            <div
              key={value}
              className="absolute left-0 right-0 border-t border-white/70"
              style={{
                top: `${100 - value}%`,
              }}
            />
          ))}

        </div>
      </div>

      {/* Palack neve */}
      <div className="absolute left-1/2 top-5 -translate-x-1/2 text-center text-white">
        <div className="rounded-2xl bg-black/60 px-5 py-3 backdrop-blur-sm">
          <p className="text-xs opacity-70">
            Palack
          </p>

          <p className="text-lg font-bold whitespace-nowrap">
            Jägermeister 0,7 L
          </p>
        </div>
      </div>

      {/* Eredmény */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center text-white">
        <div className="rounded-2xl bg-black/70 px-8 py-4 backdrop-blur-sm">
          <p className="text-xs opacity-70">
            Folyadékszint
          </p>

          <p className="text-4xl font-bold">
            57%
          </p>
        </div>
      </div>

    </div>
  );
}