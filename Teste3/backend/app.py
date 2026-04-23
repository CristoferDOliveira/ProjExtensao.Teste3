from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message  
from database import get_connection
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import uuid

app = Flask(__name__)
CORS(app)

app.config['MAIL_SERVER'] = 'sandbox.smtp.mailtrap.io'
app.config['MAIL_PORT'] = 2525
app.config['MAIL_USERNAME'] = 'a74e9b9bb1a5b0'
app.config['MAIL_PASSWORD'] = '47b06f2af7f890'
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_DEFAULT_SENDER'] = 'suporte@seuapp.com'

mail = Mail(app)
ph = PasswordHasher()

@app.route('/usuarios', methods=['GET'])
def listar_usuarios():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, nome, email FROM usersaccount")
    usuarios = cur.fetchall()
    cur.close()
    conn.close()
    lista = [{"id": u[0], "nome": u[1], "email": u[2]} for u in usuarios]
    return jsonify(lista)

@app.route('/usuarios', methods=['POST'])
def criar_usuario():
    dados = request.json
    senha_hash = ph.hash(dados['senha'])
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO usersaccount (nome, email, senha) VALUES (%s, %s, %s)",
        (dados['nome'], dados['email'], senha_hash)
    )
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"mensagem": "Usuário criado com sucesso!"}), 201

@app.route('/login', methods=['POST'])
def login():
    dados = request.json
    email = dados.get('email')
    senha = dados.get('senha')
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, nome, senha FROM usersaccount WHERE email = %s", (email,))
    usuario = cur.fetchone()
    cur.close()
    conn.close()
    if usuario:
        try:
            ph.verify(usuario[2], senha)
            return jsonify({"mensagem": "Login realizado!", "user": usuario[1], "id": usuario[0]}), 200
        except VerifyMismatchError:
            return jsonify({"mensagem": "E-mail ou senha incorretos"}), 401
    return jsonify({"mensagem": "E-mail ou senha incorretos"}), 401

@app.route('/usuarios/<int:id>', methods=['PUT'])
def editar_usuario(id):
    dados = request.json
    conn = get_connection()
    cur = conn.cursor()
    if 'nome' in dados:
        cur.execute("UPDATE usersaccount SET nome = %s WHERE id = %s", (dados['nome'], id))
    elif 'email' in dados:
        cur.execute("UPDATE usersaccount SET email = %s WHERE id = %s", (dados['email'], id))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"mensagem": "Usuário atualizado com sucesso!"}), 200

@app.route('/usuarios/<int:id>', methods=['DELETE'])
def deletar_usuario(id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM usersaccount WHERE id = %s", (id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"mensagem": "Usuário deletado com sucesso!"}), 200

@app.route('/solicitar-edicao', methods=['POST'])
def solicitar_edicao():
    dados = request.json
    usuario_id = dados.get('id')
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT email, nome FROM usersaccount WHERE id = %s", (usuario_id,))
    usuario = cur.fetchone()
    if usuario:
        email, nome = usuario[0], usuario[1]
        token = str(uuid.uuid4())[:6].upper()
        cur.execute("UPDATE usersaccount SET token_recuperacao = %s WHERE id = %s", (token, usuario_id))
        conn.commit()
        try:
            msg = Message(
                subject="Confirmação de Alteração de Dados",
                recipients=[email],
                body=f"Olá {nome}!\n\nSeu código de segurança para autorizar a alteração é: {token}"
            )
            mail.send(msg)
            cur.close()
            conn.close()
            return jsonify({"mensagem": "Código enviado!"}), 200
        except Exception:
            return jsonify({"mensagem": "Erro ao enviar e-mail"}), 500
    return jsonify({"mensagem": "Usuário não encontrado"}), 404

@app.route('/usuarios-confirmado/<int:id>', methods=['PUT'])
def editar_usuario_confirmado(id):
    dados = request.json
    token_cliente = dados.get('token')
    novo_nome = dados.get('nome')
    novo_email = dados.get('email')
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM usersaccount WHERE id = %s AND token_recuperacao = %s", (id, token_cliente))
    autorizado = cur.fetchone()
    if autorizado:
        if novo_nome:
            cur.execute("UPDATE usersaccount SET nome = %s, token_recuperacao = NULL WHERE id = %s", (novo_nome, id))
        elif novo_email:
            cur.execute("UPDATE usersaccount SET email = %s, token_recuperacao = NULL WHERE id = %s", (novo_email, id))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"mensagem": "Dados atualizados com sucesso!"}), 200
    cur.close()
    conn.close()
    return jsonify({"mensagem": "Código inválido!"}), 401

@app.route('/esqueci-senha', methods=['POST'])
def esqueci_senha():
    dados = request.json
    email = dados.get('email')
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT nome FROM usersaccount WHERE email = %s", (email,))
    usuario = cur.fetchone()
    if usuario:
        nome_usuario = usuario[0]
        token = str(uuid.uuid4())[:8].upper()
        cur.execute("UPDATE usersaccount SET token_recuperacao = %s WHERE email = %s", (token, email))
        conn.commit()
        try:
            msg = Message(
                subject="Código de Recuperação de Senha",
                recipients=[email],
                body=f"Olá {nome_usuario}!\n\nSeu código para redefinir a senha é: {token}"
            )
            mail.send(msg)
            cur.close()
            conn.close()
            return jsonify({"mensagem": "E-mail enviado com sucesso!"}), 200
        except Exception:
            return jsonify({"mensagem": "Erro ao enviar e-mail"}), 500
    cur.close()
    conn.close()
    return jsonify({"mensagem": "E-mail não encontrado"}), 404

@app.route('/resetar-senha', methods=['POST'])
def resetar_senha():
    dados = request.json
    token = dados.get('token')
    nova_senha = dados.get('nova_senha')
    nova_senha_hash = ph.hash(nova_senha)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE usersaccount SET senha = %s, token_recuperacao = NULL WHERE token_recuperacao = %s",
        (nova_senha_hash, token)
    )
    conn.commit()
    foi_alterado = cur.rowcount
    cur.close()
    conn.close()
    if foi_alterado > 0:
        return jsonify({"mensagem": "Senha alterada com sucesso!"}), 200
    else:
        return jsonify({"mensagem": "Código inválido ou expirado"}), 400

if __name__ == "__main__":
    app.run(debug=True)