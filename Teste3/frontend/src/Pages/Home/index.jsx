import { useState, useRef } from "react";
import "./style.css";
import Perfil from "./user";
import Recuperar from "./recuperar";

function Home() {
  const [userLogged, setUserLogged] = useState(null);
  const [view, setView] = useState("home"); 
  
  const inputNome = useRef();
  const inputEmail = useRef();
  const inputSenha = useRef();

  async function createUsers() {
    try {
      const response = await fetch("http://127.0.0.1:5000/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: inputNome.current.value,
          email: inputEmail.current.value,
          senha: inputSenha.current.value,
        }),
      });
      
      if (response.ok) {
        inputNome.current.value = "";
        inputEmail.current.value = "";
        inputSenha.current.value = "";
        alert("Usuário cadastrado com sucesso!");
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function handleLogin() {
    try {
      const response = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inputEmail.current.value,
          senha: inputSenha.current.value,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUserLogged({ 
          id: data.id, 
          nome: data.user, 
          email: inputEmail.current.value,
          senha: inputSenha.current.value 
        });
        inputSenha.current.value = ""; 
      } else {
        alert(data.mensagem);
      }
    } catch (error) {
      alert("Servidor fora do ar!");
    }
  }

  if (userLogged) {
    return <Perfil user={userLogged} onLogout={() => setUserLogged(null)} />;
  }

  if (view === "recuperar") {
    return <Recuperar onVoltar={() => setView("home")} />;
  }

  return (
    <div>
      <h1>Gerenciar Usuário</h1>
      <form>
        <input ref={inputNome} type="text" placeholder="Nome Completo" autoComplete="name" />
        <input ref={inputEmail} type="email" placeholder="E-mail" autoComplete="email" />
        <input ref={inputSenha} type="password" placeholder="Sua senha" autoComplete="current-password" />
        
        <p className="esquecer" onClick={() => setView("recuperar")} style={{cursor: 'pointer'}}>
          Esqueci minha senha
        </p>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={createUsers}>Cadastrar</button>
          <button type="button" onClick={handleLogin} className="login-button">Entrar</button>
        </div>
      </form>
    </div>
  );
}

export default Home;