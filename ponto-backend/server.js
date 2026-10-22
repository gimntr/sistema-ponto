const fs = require('fs'); //é o módulo do Node que lê e escreve arquivos no computador.
const path = require('path'); //ajuda a montar o caminho de um arquivo sem erro.

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

// monto o caminho completo do arquivo onde vou guardar as batidas
// __dirname é a pasta onde o server.js está, então o arquivo
// sempre vai ser criado dentro de ponto-backend
// path.join junta a pasta com o nome do arquivo sem eu me preocupar com as barras
const arquivoRegistros = path.join(__dirname, 'registros.json');


// função que salva a lista de batidas no arquivo
// ela só roda quando eu chamar salvarRegistros() lá na rota
function salvarRegistros() {
  fs.writeFileSync(arquivoRegistros, JSON.stringify(registros, null, 2));
}

//O servidor decide qual é a batida
const tiposDePonto = ['Entrada', 'Saída almoço', 'Retorno almoço', 'Saída'];

// rota de teste: se eu abrir localhost:3000 aparece essa mensagem
// serve só pra ver se o servidor está funcionando
app.get('/', (req, res) => {
    res.send('Hello, world!');
});

// rota que a tela chama quando clica em "Registrar ponto"
// req = o que a tela mandou, res = o que eu respondo pra ela
app.post('/registroPontoEstag/registra-ponto', (req, res) => {

    const hoje = new Date().toDateString(); // transforma a data de agora em um texto só com o dia

    const registrosDeHoje = registros.filter(r =>
        // percorre a lista e guarda só os itens que passam no teste.
        r.userCode === req.body.userCode && r.dataHora.toDateString() === hoje
    );

    console.log('Já bateu hoje:', registrosDeHoje.length);
    // é a quantidade de itens que sobraram, ou seja, quantas batidas ele já fez hoje.

    // vale 4, a quantidade de batidas possíveis no dia.
    // pergunta: “ele já bateu 4 vezes ou mais?”. Se sim, entra nas chaves.
    // O return faz a rota parar ali. O código de baixo (que guarda a batida) não roda, então a quinta batida nunca entra na lista.
    if (registrosDeHoje.length >= tiposDePonto.length) {
        return res.json({
            data: { status: 0 },
            message: 'Você já registrou todos os pontos de hoje'
        });
    }

    const tipo = tiposDePonto[registrosDeHoje.length];
    console.log('Tipo desta batida:', tipo);

    // mostra no terminal o que chegou, pra eu conferir se deu certo
    console.log('Recebi:', req.body);

    // monto a "ficha" da batida com o código do usuário e a hora de agora
    // a hora é pega aqui no servidor pra ninguém conseguir mudar
    const novoRegistro = {
        userCode: req.body.userCode,
        tipo: tipo,
        dataHora: new Date()
    };

    registros.push(novoRegistro);

    res.json({
        data: { status: 1, tipo: tipo },
        message: 'Ponto registrado'
    });
});

// rota pra eu ver tudo que já foi guardado
// abro localhost:3000/registros no navegador e a lista aparece
app.get('/registros', (req, res) => {
    res.json(registros);
});

app.get ('/registroPontoEstag/registros-hoje', (req, res) => {
    const hoje = new Date (). toDateString();
    
    const registrosDeHoje = registros.filter(r =>
        r.userCode === req.query.userCode && r.dataHora.toDateString() === hoje
    );

    res.json ({
        data: { status:1,  registros: registrosDeHoje },
        message: 'ok'
    });
});
// liga o servidor na porta 3000 e avisa no terminal
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});