import { useState } from "react";
import "./user.css";
import JUANWPP from "../../../public/assets/JUANWPP.jpg";

function Perfil({ user, onLogout }) {
  const [confirmando, setConfirmando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [esperandoToken, setEsperandoToken] = useState(false);
  const [campoParaEditar, setCampoParaEditar] = useState("nome");
  const [novoValor, setNovoValor] = useState("");
  const [senhaConfirmacao, setSenhaConfirmacao] = useState("");
  const [tokenVerificacao, setTokenVerificacao] = useState("");

  async function handleDelete() {
    if (senhaConfirmacao !== user.senha) {
      alert("Senha incorreta!");
      return;
    }
    const confirmarModulo = window.confirm("Tem certeza que deseja apagar sua conta?");
    if (confirmarModulo) {
      try {
        const response = await fetch(`http://127.0.0.1:5000/usuarios/${user.id}`, { 
          method: "DELETE" 
        });
        if (response.ok) { 
          onLogout(); 
        }
      } catch (error) { 
        console.error(error); 
      }
    }
  }

  async function solicitarCodigo() {
    if (senhaConfirmacao !== user.senha) {
      alert("Senha incorreta!");
      return;
    }
    if (!novoValor.trim()) {
      alert("O novo valor não pode estar vazio!");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/solicitar-edicao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id }),
      });

      if (response.ok) {
        alert("Código de verificação enviado para o seu e-mail!");
        setEsperandoToken(true);
      } else {
        alert("Erro ao solicitar código.");
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function handleEdit() {
    try {
      const response = await fetch(`http://127.0.0.1:5000/usuarios-confirmado/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          [campoParaEditar]: novoValor,
          token: tokenVerificacao 
        }),
      });

      if (response.ok) {
        alert("Dados atualizados! Por segurança, faça login novamente.");
        onLogout();
      } else {
        const erro = await response.json();
        alert("Erro: " + erro.mensagem);
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="perfil-container">
      <h1>Perfil do Usuário</h1>
      <div className="perfil">
        <p><strong>Nome:</strong> {user.nome}</p>
        <p><strong>Email:</strong> {user.email}</p>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '15px', flexDirection: 'column' }}>
        {!editando && !confirmando && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onLogout} className="btn-sair">Sair</button>
            <button type="button" onClick={() => setEditando(true)}>Editar Dados</button>
            <button type="button" className="apagar" onClick={() => setConfirmando(true)}>
              <img src={JUANWPP} alt="Ícone" style={{ width: '25px', borderRadius: '5px' }} />
              <span>Apagar</span>
            </button>
          </div>
        )}

        {editando && (
          <div className="painel-edicao">
            {!esperandoToken ? (
              <>
                <h3>O que deseja alterar?</h3>
                <div className="radios">
                  <label><input type="radio" checked={campoParaEditar === "nome"} onChange={() => setCampoParaEditar("nome")} /> Nome</label>
                  <label><input type="radio" checked={campoParaEditar === "email"} onChange={() => setCampoParaEditar("email")} /> Email</label>
                </div>
                <input type={campoParaEditar === "email" ? "email" : "text"} placeholder={`Novo ${campoParaEditar}`} className="input-confirmar" value={novoValor} onChange={(e) => setNovoValor(e.target.value)} />
                <input type="password" placeholder="Sua senha para confirmar" className="input-confirmar" value={senhaConfirmacao} onChange={(e) => setSenhaConfirmacao(e.target.value)} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={solicitarCodigo} className="btn-confirmar-delete">Pedir Código</button>
                  <button type="button" onClick={() => { setEditando(false); setSenhaConfirmacao(""); setNovoValor(""); }}>Cancelar</button>
                </div>
              </>
            ) : (
              <>
                <h3>Confirme o código</h3>
                <input type="text" placeholder="Digite o código" className="input-confirmar" value={tokenVerificacao} onChange={(e) => setTokenVerificacao(e.target.value.toUpperCase())} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={handleEdit} className="btn-confirmar-delete">Salvar</button>
                  <button type="button" onClick={() => setEsperandoToken(false)}>Voltar</button>
                </div>
              </>
            )}
          </div>
        )}

        {confirmando && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input type="password" placeholder="Senha para DELETAR" className="input-confirmar" value={senhaConfirmacao} onChange={(e) => setSenhaConfirmacao(e.target.value)} />
            <button type="button" onClick={handleDelete} className="btn-confirmar-delete">Deletar</button>
            <button type="button" onClick={() => { setConfirmando(false); setSenhaConfirmacao(""); }}>Cancelar</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Perfil;