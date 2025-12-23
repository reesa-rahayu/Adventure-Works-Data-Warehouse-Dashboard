import React, { useState } from 'react';
import Login from 'user/login';
import Dashboard from './Dashboard';

const App = () => {
  const [role, setRole] = useState(null);

  const handleLogin = () => {
    setRole(localStorage.getItem('role'));
  };

  return (
    <div>
      {!role && <Login onLogin={handleLogin} />}
      {role && <Dashboard role={role} />}
    </div>
  );
};

export default App;