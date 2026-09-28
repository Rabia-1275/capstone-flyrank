export default async function HealthPage() {
  const res = await fetch("https://api.github.com/zen", { cache: "no-store" });
  const zen = await res.text();
  return (
    <section>
      <h1 className="text-2xl font-bold">Health check</h1>
      <p className="mt-2">Status: {res.ok ? "OK" : "Error"}</p>
      <p className="text-sm text-muted">Fetched: {zen}</p>
    </section>
  );
}