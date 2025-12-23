export default function ProductionOLapPage() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border">
      <h2 className="text-2xl font-bold mb-6">
        💰 Sales Analysis <span className="text-xs text-gray-400">JPivot</span>
      </h2>

      {/* Embed JPivot/Mondrian pivot page */}
      <iframe
        src="http://localhost:8080/mondrian/testpage.jsp?query=productionfact" // replace with your JPivot JSP URL
        style={{
          width: "100%",
          height: "800px",
          border: "none",
          borderRadius: "0.5rem",
        }}
        title="Sales OLAP Pivot"
      />
    </div>
  );
}
