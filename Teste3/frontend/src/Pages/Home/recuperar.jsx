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
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Código de recuperação enviado! Verifique sua caixa de entrada (Mailtrap).");
        setEtapa(2);
      } else {
        alert(data.mensagem);
      }
    } catch (error) {
      alert("Erro ao conectar com o servidor.");
    }
  }

  async function alterarSenha() {
    try {
      const res = await fetch("http://127.0.0.1:5000/resetar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nova_senha: novaSenha }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Senha alterada com sucesso! Agora você já pode fazer login.");
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
        <>
          <p>Informe seu e-mail para receber o código de 8 dígitos.</p>
          <input 
            type="email" 
            placeholder="Digite seu e-mail" 
            onChange={e => setEmail(e.target.value)} 
          />
          <button onClick={pedirCodigo}>Enviar Código</button>
        </>
      ) : (
        <>
          <p>Digite o código enviado e sua nova senha abaixo.</p>
          <input 
            type="text" 
            placeholder="Código de 8 dígitos" 
            onChange={e => setToken(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="Nova Senha" 
            onChange={e => setNovaSenha(e.target.value)} 
          />
          <button onClick={alterarSenha}>Salvar Nova Senha</button>
        </>
      )}
      <button onClick={onVoltar} className="btn-voltar" style={{ marginTop: '10px' }}>
        Voltar ao Login
      </button>
    </div>
  );
}

export default Recuperar;