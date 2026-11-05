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

// quando o servidor liga, ele lê o arquivo e pega a lista de batidas que estava guardada
// (a função carregarRegistros está mais embaixo)
const registros = carregarRegistros();

// monto o caminho completo do arquivo onde vou guardar as batidas
const arquivoRegistros = path.join(__dirname, 'registros.json');

// função que salva a lista de batidas no arquivo
function salvarRegistros() {
    fs.writeFileSync(arquivoRegistros, JSON.stringify(registros, null, 2));
}

// função que lê o arquivo e devolve a lista de batidas
function carregarRegistros() {
    const arquivoRegistros = path.join(__dirname, 'registros.json');

    // se o arquivo ainda não existe, devolvo uma lista vazia
    if (!fs.existsSync(arquivoRegistros)) {
        return [];
    }

    // leio o arquivo como texto
    const texto = fs.readFileSync(arquivoRegistros, 'utf-8');

    // se o arquivo existe mas está vazio, também devolvo lista vazia
    if (texto.trim() === '') {
        return [];
    }

    // transformo o texto de volta em lista e refaço as datas
    return JSON.parse(texto).map(r => ({
        ...r,
        dataHora: new Date(r.dataHora)
    }));
}

// lista com o nome de cada batida do dia, na ordem certa
const tiposDePonto = ['Entrada', 'Saída almoço', 'Retorno almoço', 'Saída'];

// rota de teste: se eu abrir localhost:3000 aparece essa mensagem
app.get('/', (req, res) => {
    res.send('Hello, world!');
});

// rota que a tela chama quando clica em "Registrar ponto"
app.post('/registroPontoEstag/registra-ponto', (req, res) => {

    // pego a data de hoje como texto, só com o dia (sem a hora)
    const hoje = new Date().toDateString();

    // guardo só as batidas desse usuário que são de hoje
    const registrosDeHoje = registros.filter(r =>
        r.userCode === req.body.userCode && r.dataHora.toDateString() === hoje
    );

    // mostra no terminal quantas batidas ele já fez hoje (antes da atual)
    console.log('Já bateu hoje:', registrosDeHoje.length);

    // se ele já bateu 4 vezes ou mais, não deixo bater de novo
    if (registrosDeHoje.length >= tiposDePonto.length) {
        return res.json({
            data: { status: 0 },
            message: 'Você já registrou todos os pontos de hoje'
        });
    }

    // descubro o tipo da batida usando a quantidade que ele já bateu como posição
    const tipo = tiposDePonto[registrosDeHoje.length];
    console.log('Tipo desta batida:', tipo);

    // mostra no terminal o que a tela mandou
    console.log('Recebi:', req.body);

    // monto a "ficha" da batida
    const novoRegistro = {
        userCode: req.body.userCode,
        tipo: tipo,
        dataHora: new Date()
    };

    // coloco a ficha no final da lista
    registros.push(novoRegistro);

    // salvo a lista inteira no arquivo
    salvarRegistros();

    // respondo pra tela no formato que ela espera
    res.json({
        data: { status: 1, tipo: tipo },
        message: 'Ponto registrado'
    });
});

// rota pra eu ver tudo que já foi guardado
app.get('/registros', (req, res) => {
    res.json(registros);
});

// rota que a tela chama quando abre, pra mostrar as batidas de hoje
app.get('/registroPontoEstag/registros-hoje', (req, res) => {

    // pego o dia de hoje
    const hoje = new Date().toDateString();

    // separo só as batidas desse usuário que são de hoje
    const registrosDeHoje = registros.filter(r =>
        r.userCode === req.query.userCode && r.dataHora.toDateString() === hoje
    );

    // devolvo a lista pra tela
    res.json({
        data: { status: 1, registros: registrosDeHoje },
        message: 'ok'
    });
});

// rota de login: responde nos dois endereços (/login e /registroPontoEstag/login)
app.post(["/login", "/registroPontoEstag/login"], async (req, res) => {
    try {
        // pego o usuário e a senha que a tela mandou
        const { username, password } = req.body;

        // o carteiro vai até o ERP levando o usuário e a senha
        const resposta = await fetch(
            "https://helpdesk.medsystems.com.br:3000/registroPontoEstag/login",
            {
                method: "POST",
                body: new URLSearchParams({ username, password }),
            }
        );

        // abro o pacote que o ERP devolveu
        const dados = await resposta.json();

        // falo em voz alta no terminal tudo que o ERP respondeu
        // (é aqui que eu vou descobrir onde está o crachá/token)
        console.log("Resposta do ERP:", dados);

        // entrego o pacote INTEIRO pra tela (antes eu entregava só o userCode)
        res.json(dados);

    } catch (erro) {
        // se qualquer coisa lá de cima falhar, cai aqui
        console.log("Erro no login:", erro.message);
        console.log("Causa:", erro.cause);
        res.status(500).json({ message: "Não foi possível fazer login" });
    }
});

// rota de consulta: a tela pede as batidas de uma pessoa num período
app.get("/consulta", async (req, res) => {
    try {
        // pego o crachá que a tela mandou pendurado no envelope (header)
        const token = req.headers.authorization;

        // pego as três perguntas que a tela mandou: quem, desde quando e até quando
        const { userCode, dataInicio, dataFim } = req.query;

        // arrumo as três perguntas no formato de endereço
        const parametros = new URLSearchParams({ userCode, dataInicio, dataFim });

        // junto o endereço do ERP com as perguntas
        const url = "https://helpdesk.medsystems.com.br:3000/registroPontoEstag/espelho-ponto?" + parametros;

        // o carteiro vai até o ERP levando o crachá
        const resposta = await fetch(url, {
            headers: { authorization: token },
        });

        // abro o pacote que o ERP devolveu
        const dados = await resposta.json();

        // entrego o pacote pra tela
        res.json(dados);

    } catch (erro) {
        // se der qualquer problema, aviso no terminal e na tela
        console.log("Erro na consulta:", erro.message);
        res.status(500).json({ message: "Não foi possível consultar" });
    }
});

// liga o servidor na porta 3000 e avisa no terminal
app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});