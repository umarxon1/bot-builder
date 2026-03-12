export default function DashboardLoading() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-36 animate-pulse rounded-[28px] border border-white/80 bg-white/80"
        />
      ))}
    </div>
  );
}
