import React, { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [showRegister, setShowRegister] = useState(false);

  if (token) {
    return (
      <div className="App">
        <h1>Sistema de Riego IoT</h1>
        <p>Bienvenido. Estás autenticado.</p>
        <button onClick={() => { localStorage.removeItem('token'); setToken(null); }}>
          Cerrar Sesión
        </button>
      </div>
    );
  }

  return (
    <div className="App">
      <h1>Sistema de Riego IoT</h1>
      {showRegister ? (
        <>
          <Register />
          <button onClick={() => setShowRegister(false)}>Ir a Login</button>
        </>
      ) : (
        <>
          <Login setToken={setToken} />
          <button onClick={() => setShowRegister(true)}>Ir a Registrarse</button>
        </>
      )}
    </div>
  );
}

export default App;