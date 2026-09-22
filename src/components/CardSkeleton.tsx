export default function CardSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 md:p-4 flex flex-col justify-between shadow-lg"
        >
          {/* Emplacement du visuel de la carte */}
          <div className="mb-3 bg-slate-800/60 rounded-lg min-h-[160px] md:min-h-[190px] flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-slate-700/50"></div>
          </div>

          {/* Titre et numéro */}
          <div className="space-y-2 mb-3">
            <div className="flex justify-between items-center gap-2">
              <div className="h-3.5 bg-slate-800 rounded w-3/4"></div>
              <div className="h-3 bg-slate-800 rounded w-8 shrink-0"></div>
            </div>
          </div>

          {/* Boutons Normal / Foil */}
          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800/80">
            <div className="h-7 bg-slate-800 rounded-lg"></div>
            <div className="h-7 bg-slate-800 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
}