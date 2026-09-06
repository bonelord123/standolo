"use client";

export default function BottleOverlay() {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      {/* 
        A statikus palack-overlay ideiglenesen kikapcsolva.
        
        Most az AI palackfelismerést teszteljük,
        ezért a kamera képe szabadon látható.
      */}
    </div>
  );
}