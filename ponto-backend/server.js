// importo o fs, que é o módulo do Node que lê e escreve arquivos no computador
const fs = require('fs');

// importo o path, que ajuda a montar o caminho de um arquivo sem errar as barras
const path = require('path');

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

// aqui eu pego a lista de batidas que estava guardada no arquivo
// quando o servidor liga, ele chama a função carregarRegistros (que está mais embaixo)
// se não tiver arquivo ainda, a lista começa vazia
const registros = carregarRegistros();

// monto o caminho completo do arquivo onde vou guardar as batidas
// __dirname é a pasta onde o server.js está, então o arquivo
// sempre vai ser criado dentro de ponto-backend
// path.join junta a pasta com o nome do arquivo sem eu me preocupar com as barras
const arquivoRegistros = path.join(__dirname, 'registros.json');

// função que salva a lista de batidas no arquivo
// ela só roda quando eu chamar salvarRegistros() lá na rota
function salvarRegistros() {
    // JSON.stringify transforma a lista em texto, porque arquivo só guarda texto
    // o null e o 2 servem só pra deixar o texto organizado e fácil de ler
    // writeFileSync escreve no arquivo (cria se não existir, troca o conteúdo se existir)
    fs.writeFileSync(arquivoRegistros, JSON.stringify(registros, null, 2));
}

// função que lê o arquivo e devolve a lista de batidas
function carregarRegistros() {
    // monto o caminho do arquivo de novo (aqui dentro da função)
    const arquivoRegistros = path.join(__dirname, 'registros.json');

    // se o arquivo ainda não existe (primeira vez que o sistema roda),
    // devolvo uma lista vazia e a função para aqui
    if (!fs.existsSync(arquivoRegistros)) {
        return [];
    }

    // leio o arquivo como texto
    const texto = fs.readFileSync(arquivoRegistros, 'utf-8');

    // se o arquivo existe mas está vazio, também devolvo lista vazia
    // (o JSON.parse dá erro com texto vazio, então eu evito isso)
    if (texto.trim() === '') {
        return [];
    }

    // JSON.parse transforma o texto de volta em lista
    // o map percorre cada batida e refaz a data, porque no arquivo
    // a data fica como texto e eu preciso dela como data de verdade
    // o ...r copia os campos da batida (userCode, tipo) e o dataHora é trocado
    return JSON.parse(texto).map(r => ({
        ...r,
        dataHora: new Date(r.dataHora)
    }));
}

// lista com o nome de cada batida do dia, na ordem certa
// posição 0 = Entrada, 1 = Saída almoço, 2 = Retorno almoço, 3 = Saída
// é o servidor que decide qual é a batida
const tiposDePonto = ['Entrada', 'Saída almoço', 'Retorno almoço', 'Saída'];

// rota de teste: se eu abrir localhost:3000 aparece essa mensagem
// serve só pra ver se o servidor está funcionando
app.get('/', (req, res) => {
    res.send('Hello, world!');
});

// rota que a tela chama quando clica em "Registrar ponto"
// req = o que a tela mandou, res = o que eu respondo pra ela
app.post('/registroPontoEstag/registra-ponto', (req, res) => {

    // pego a data de hoje como texto, só com o dia (sem a hora)
    // assim consigo comparar "é o mesmo dia?"
    const hoje = new Date().toDateString();

    // o filter percorre a lista e guarda só os itens que passam no teste
    // o teste tem duas partes: ser do mesmo usuário E ser de hoje
    const registrosDeHoje = registros.filter(r =>
        r.userCode === req.body.userCode && r.dataHora.toDateString() === hoje
    );

    // mostra no terminal quantas batidas ele já fez hoje (antes da atual)
    console.log('Já bateu hoje:', registrosDeHoje.length);

    // se ele já bateu 4 vezes ou mais, não deixo bater de novo
    // o return faz a rota parar aqui, então o código de baixo não roda
    // e a quinta batida nunca entra na lista
    // status 0 avisa a tela que deu errado
    if (registrosDeHoje.length >= tiposDePonto.length) {
        return res.json({
            data: { status: 0 },
            message: 'Você já registrou todos os pontos de hoje'
        });
    }

    // descubro o tipo da batida usando a quantidade que ele já bateu como posição
    // se já bateu 0, pega a posição 0 (Entrada), se bateu 1, pega a 1, e assim vai
    const tipo = tiposDePonto[registrosDeHoje.length];
    console.log('Tipo desta batida:', tipo);

    // mostra no terminal o que a tela mandou, pra eu conferir se deu certo
    console.log('Recebi:', req.body);

    // monto a "ficha" da batida com o código do usuário, o tipo e a hora de agora
    // a hora é pega aqui no servidor pra ninguém conseguir mudar
    const novoRegistro = {
        userCode: req.body.userCode,
        tipo: tipo,
        dataHora: new Date()
    };

    // coloco a ficha no final da lista
    registros.push(novoRegistro);

    // salvo a lista inteira no arquivo, pra não perder se o servidor reiniciar
    salvarRegistros();

    // respondo pra tela no formato que ela espera
    // status 1 quer dizer que deu tudo certo, e mando o tipo junto
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

// rota que a tela chama quando abre, pra mostrar as batidas de hoje
// o userCode vem no endereço (depois do ?), por isso uso req.query
app.get('/registroPontoEstag/registros-hoje', (req, res) => {

    // pego o dia de hoje de novo (repetido da outra rota, mas por enquanto tudo bem)
    const hoje = new Date().toDateString();

    // guardo só as batidas desse usuário que são de hoje
    const registrosDeHoje = registros.filter(r =>
        r.userCode === req.query.userCode && r.dataHora.toDateString() === hoje
    );

    // devolvo as batidas no mesmo formato das outras respostas
    res.json({
        data: { status: 1, registros: registrosDeHoje },
        message: 'ok'
    });
});

// Cria um endereço novo no SEU servidor: POST http://localhost:3000/login
// "async" é necessário porque dentro dela usamos "await" (esperar uma resposta)
app.post("/login", async (req, res) => {
  // Pega usuário e senha que a tela enviou no corpo (body) do pedido
  const { username, password } = req.body;

  // Chama a API do ERP, igual ao teste-login.js, mas agora com os dados que vieram da tela
  const resposta = await fetch(
    "https://helpdesk.medsystems.com.br:3000/registroPontoEstag/login",
    {
      method: "POST", // a documentação da API pede POST
      // A API espera formData (formato de formulário), por isso URLSearchParams
      body: new URLSearchParams({ username, password }),
    }
  );

  // Converte a resposta da API (texto JSON) em um objeto que o JavaScript entende
  const dados = await resposta.json();

  // Responde para a tela com APENAS o userCode.
  // O bearer e o JSONID ficam de fora de propósito, para não irem ao navegador.
  res.json({ userCode: dados.userCode });
});

// liga o servidor na porta 3000 e avisa no terminal
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});