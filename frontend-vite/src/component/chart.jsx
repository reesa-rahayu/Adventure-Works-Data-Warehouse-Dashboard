export default function ChartCard({ title, children }) {
    return (
      <div className="bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        <div className="h-72">{children}</div>
      </div>
    );
}
  