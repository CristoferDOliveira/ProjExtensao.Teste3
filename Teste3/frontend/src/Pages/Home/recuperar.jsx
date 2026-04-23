import { useState } from "react";
import "./recuperar.css";

function Recuperar({ onVoltar }) {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [etapa, setEtapa] = useState(1);

  async function pedirCodigo() {
    try {
      const res = await fetch("http://127.0.0.1:5000/esqueci-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Código de recuperação enviado! Verifique sua caixa de entrada.");
        setEtapa(2);
      } else {
        alert(data.mensagem);
      }
    } catch (error) {
      alert("Erro ao conectar com o servidor.");
    }
  }

  async function alterarSenha() {
    if (!token || !novaSenha) {
      alert("Preencha todos os campos!");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:5000/resetar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token: token.trim().toUpperCase(), 
          nova_senha: novaSenha 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Senha alterada com sucesso!");
        onVoltar();
      } else {
        alert(data.mensagem || "Código inválido ou expirado.");
      }
    } catch (error) {
      alert("Erro ao conectar com o servidor.");
    }
  }

  return (
    <div className="recuperar-container">
      <h1>Recuperar Senha</h1>
      
      {etapa === 1 ? (
        <div key="fluxo-email">
          <p>Informe seu e-mail para receber o código de 8 dígitos.</p>
          <input 
            type="email" 
            name="user_email_recovery"
            placeholder="Digite seu e-mail" 
            value={email}
            autoComplete="email"
            onChange={e => setEmail(e.target.value)} 
          />
          <button className="teste" onClick={pedirCodigo}>Enviar Código</button>
        </div>
      ) : (
        <div key="fluxo-token">
          <p>Digite o código enviado e sua nova senha abaixo.</p>
          <input 
            type="text" 
            name="recovery_token_code"
            placeholder="Código de 8 dígitos" 
            value={token}
            autoComplete="off"
            onChange={e => setToken(e.target.value)} 
          />
          <input 
            type="password" 
            name="user_new_password_secure"
            placeholder="Nova Senha" 
            value={novaSenha}
            autoComplete="new-password"
            onChange={e => setNovaSenha(e.target.value)} 
          />
          <button className="teste" onClick={alterarSenha}>Salvar Nova Senha</button>
        </div>
      )}
      
      <button className="teste" onClick={onVoltar} style={{ marginTop: '10px' }}>
        Voltar ao Login
      </button>
    </div>
  );
}

export default Recuperar;