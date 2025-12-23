import { useState } from "react";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Use the login function passed from App.jsx via useAuth
    await onLogin({ email, password, setErrors });
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Adventure Works Login</h2>
        
        {errors.length > 0 && (
          <div className="bg-red-100 text-red-600 p-2 mb-4 rounded text-sm">
            {errors.map((err, i) => <p key={i}>{err}</p>)}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" className="w-full border p-2 rounded" 
            value={email} onChange={e => setEmail(e.target.value)} required />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" className="w-full border p-2 rounded" 
            value={password} onChange={e => setPassword(e.target.value)} required />
        </div>

        <button type="submit" className="w-full bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition">
          Login
        </button>
      </form>
    </div>
  );
}
