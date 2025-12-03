import { useState } from "react";
import axios from "axios";

export default function CubeQuery() {
  const [result, setResult] = useState(null);

  const runQuery = async () => {
    const mdx = `
      SELECT
        {[Measures].[Sales]} ON COLUMNS,
        [Date].[Year].Members ON ROWS
      FROM [AdventureWorksCube]
    `;

    try {
      const res = await axios.post("http://localhost:8000/api/mdx", { mdx });
      setResult(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <button onClick={runQuery}>Run MDX Query</button>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
