export default function Loading() {
  return (
    <div className="container-lux py-8" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div className="skeleton aspect-[3/4] rounded-[28px]" />
        <div className="space-y-4">
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-10 w-3/4 rounded-xl" />
          <div className="skeleton h-7 w-32 rounded" />
          <div className="flex gap-3 pt-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton size-11 rounded-full" />
            ))}
          </div>
          <div className="flex gap-2 pt-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-12 w-14 rounded-full" />
            ))}
          </div>
          <div className="skeleton mt-6 h-13 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
