export default function DashboardPage({ params }: { params: { ticker: string } }) {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold">Dashboard: {params.ticker}</h1>
      <p className="text-muted-foreground">Coming soon...</p>
    </div>
  );
}
