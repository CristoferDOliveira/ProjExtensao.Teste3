from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message  
from database import get_connection
import uuid

app = Flask(__name__)
CORS(app)

app.config['MAIL_SERVER']='sandbox.smtp.mailtrap.io'
app.config['MAIL_PORT'] = 2525
app.config['MAIL_USERNAME'] = 'a74e9b9bb1a5b0'
app.config['MAIL_PASSWORD'] = '47b06f2af7f890'
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_DEFAULT_SENDER'] = 'suporte@seuapp.com'

mail = Mail(app)

@app.route('/usuarios', methods=['GET'])
def listar_usuarios():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, nome, email, senha FROM usersaccount")
    usuarios = cur.fetchall()
    cur.close()
    conn.close()
    
    lista = [{"id": u[0], "nome": u[1], "email": u[2], "senha": u[3]} for u in usuarios]
    return jsonify(lista)

@app.route('/usuarios', methods=['POST'])
def criar_usuario():
    dados = request.json
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO usersaccount (nome, email, senha) VALUES (%s, %s, %s)",
        (dados['nome'], dados['email'], dados['senha'])
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
    cur.execute("SELECT id, nome FROM usersaccount WHERE email = %s AND senha = %s", (email, senha))
    usuario = cur.fetchone()
    cur.close()
    conn.close()

    if usuario:
        return jsonify({
            "mensagem": "Login realizado!", 
            "user": usuario[1], 
            "id": usuario[0] 
        }), 200
    else:
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
                body=f"Olá {nome_usuario}!\n\nSeu código para redefinir a senha é: {token}\n\nSe você não solicitou esta alteração, ignore este e-mail."
            )
            mail.send(msg)
            
            cur.close()
            conn.close()
            return jsonify({"mensagem": "E-mail enviado com sucesso!"}), 200
            
        except Exception as e:
            print(f"Erro ao enviar e-mail: {e}")
            return jsonify({"mensagem": "Erro ao enviar e-mail. Tente novamente mais tarde."}), 500
    
    cur.close()
    conn.close()
    return jsonify({"mensagem": "E-mail não encontrado"}), 404

@app.route('/resetar-senha', methods=['POST'])
def resetar_senha():
    dados = request.json
    token = dados.get('token')
    nova_senha = dados.get('nova_senha')

    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute(
        "UPDATE usersaccount SET senha = %s, token_recuperacao = NULL WHERE token_recuperacao = %s",
        (nova_senha, token)
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