// importo o cors, que deixa a tela (front) conversar com o servidor
// mesmo estando em endereços diferentes
const cors = require('cors');

// importo o express, que é o que cria o servidor
const express = require('express');

// crio o servidor e guardo na variável app
const app = express();

// aviso o servidor pra usar o cors em todas as rotas
app.use(cors());

// ensina o servidor a entender o JSON que a tela manda
// (tem que ficar antes das rotas, senão o req.body vem vazio)
app.use(express.json());

// lista vazia onde eu vou guardar cada batida de ponto
// fica na memória, então se o servidor reiniciar ela zera
const registros = [];

// rota de teste: se eu abrir localhost:3000 aparece essa mensagem
// serve só pra ver se o servidor está funcionando
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

// rota que a tela chama quando clica em "Registrar ponto"
// req = o que a tela mandou, res = o que eu respondo pra ela
app.post('/registroPontoEstag/registra-ponto', (req, res) => {

  // mostra no terminal o que chegou, pra eu conferir se deu certo
  console.log('Recebi:', req.body);

  // monto a "ficha" da batida com o código do usuário e a hora de agora
  // a hora é pega aqui no servidor pra ninguém conseguir mudar
  const novoRegistro = {
    userCode: req.body.userCode,
    dataHora: new Date()
  };

  // coloco a ficha no final da lista
  registros.push(novoRegistro);

  // respondo pra tela no formato que ela espera
  // status 1 quer dizer que deu tudo certo
  res.json({
    data: { status: 1 },
    message: 'Ponto registrado'
  });
});

// rota pra eu ver tudo que já foi guardado
// abro localhost:3000/registros no navegador e a lista aparece
app.get('/registros', (req, res) => {
  res.json(registros);
});

// liga o servidor na porta 3000 e avisa no terminal
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});