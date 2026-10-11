export default function Loading() {
  return (
    <div className="mt-8 max-w-4xl mx-auto space-y-6 animate-pulse" aria-busy="true" aria-label="Loading content">
      {/* Header skeleton */}
      <div className="space-y-2.5">
        <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
        <div className="h-4 w-72 bg-gray-100 rounded"></div>
      </div>

      {/* Grid cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-white border border-gray-100 rounded-xl p-4 space-y-3 shadow-xs">
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-7 w-14 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>

      {/* Main card skeleton */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-4 shadow-xs">
        <div className="h-5 w-40 bg-gray-200 rounded"></div>
        <div className="h-4 w-full bg-gray-100 rounded"></div>
        <div className="h-4 w-5/6 bg-gray-100 rounded"></div>
        <div className="h-4 w-2/3 bg-gray-100 rounded"></div>
      </div>
    </div>
  )
}
