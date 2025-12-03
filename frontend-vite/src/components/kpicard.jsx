export default function KPICard({ title, value, change, negative }) {
    return (
      <div className="bg-white p-5 shadow rounded border-l-4 border-pink-500">
        <h3 className="text-xs uppercase text-gray-500">{title}</h3>
        <div className="text-3xl font-bold text-gray-800">{value}</div>
        <div className={`text-sm mt-1 ${negative ? "text-red-800" : "text-green-800"}`}>
          {change} dari periode sebelumnya
        </div>
      </div>
    );
  }