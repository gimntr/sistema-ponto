// aqui eu pego cada elemento pelo id que está no HTML
// e guardo em uma variável pra usar depois
const clock = document.getElementById('clock');       // o relógio 00:00:00
const dateEl = document.getElementById('date');       // o texto da data
const punchBtn = document.getElementById('punchBtn'); // o botão "Registrar ponto"
const statusEl = document.getElementById('status');   // a mensagem embaixo do botão
const empty = document.getElementById('empty');       // o texto "Nenhum registro ainda hoje."
const logList = document.getElementById('logList');   // a lista (ul) dos registros

// lista com o nome de cada batida do dia, na ordem certa
// 1ª vez que clica = Entrada, 2ª = Saída almoço, e assim vai
const tiposDePonto = ['Entrada', 'Saída almoço', 'Retorno almoço', 'Saída'];

// contador pra saber quantas vezes já bateu o ponto hoje
// começa em 0 porque ainda não bateu nenhum
let totalRegistros = 0;

// se o número for 5 vira "05", se for 12 continua "12"
// String() transforma o número em texto, padStart completa com zero até ter 2 dígitos
function doisDigitos(numero) {
    return String(numero).padStart(2, '0');
}

// devolve a hora no formato "HH:MM:SS"
function pegarHoraAtual() {
    const agora = new Date(); // pega a data e hora de agora

    const horas = doisDigitos(agora.getHours());       // horas
    const minutos = doisDigitos(agora.getMinutes());   // minutos
    const segundos = doisDigitos(agora.getSeconds());  // segundos

    // junta tudo separado por dois pontos
    return `${horas}:${minutos}:${segundos}`;
}

function atualizarRelogio() {
    const agora = new Date();

    const horas = doisDigitos(agora.getHours());
    const minutos = doisDigitos(agora.getMinutes());
    const segundos = doisDigitos(agora.getSeconds());

    // aqui uso innerHTML (e não textContent) porque quero manter
    // o <span class="colon"> nos dois pontos, senão perde o estilo do CSS
    clock.innerHTML = `${horas}<span class="colon">:</span>${minutos}<span class="colon">:</span>${segundos}`;
}

function atualizarData() {
    const hoje = new Date();

    // toLocaleDateString escreve a data por extenso em português
    // ex: "Quinta-feira, 8 de Outubro de 2026"
    // o CSS já deixa a primeira letra maiúscula (text-transform: capitalize)
    dateEl.textContent = hoje.toLocaleDateString('pt-BR', {
        weekday: 'long',  // dia da semana
        day: 'numeric',   // número do dia
        month: 'long',    // nome do mês
        year: 'numeric'   // ano
    });
}

// essa função roda toda vez que o usuário clica no botão
function registrarPonto() {
    // se já bateu os 4 pontos do dia, não deixa bater mais
    if (totalRegistros >= tiposDePonto.length) {
        statusEl.textContent = 'Você já registrou todos os pontos de hoje.';
        return; // sai da função aqui
    }

    // descobre qual é o tipo desse ponto usando o contador como posição na lista
    // (posição 0 = Entrada, 1 = Saída almoço...)
    const tipo = tiposDePonto[totalRegistros];

    // pega a hora exata do clique
    const hora = pegarHoraAtual();

    // cria um item novo da lista (<li>)
    const item = document.createElement('li');

    // coloca o tipo e a hora dentro do item
    // o CSS já separa um de cada lado (justify-content: space-between)
    item.innerHTML = `<span>${tipo}</span><span>${hora}</span>`;

    // prepend coloca o item no começo da lista
    // assim o registro mais recente fica sempre no topo
    logList.prepend(item);

    // some com o texto "Nenhum registro ainda hoje."
    // hidden = true esconde o elemento
    empty.hidden = true;

    // mostra a mensagem de confirmação embaixo do botão
    statusEl.textContent = `${tipo} registrada às ${hora}`;

    // soma 1 no contador, porque acabou de bater mais um ponto
    totalRegistros++;

    // se chegou nos 4 pontos, desativa o botão pra não clicar mais
    if (totalRegistros === tiposDePonto.length) {
        punchBtn.disabled = true;
    }
}

// quando clicar no botão, chama a função registrarPonto
punchBtn.addEventListener('click', registrarPonto);

// chama as duas uma vez logo de cara
// senão ficaria "00:00:00" e "carregando data..." por 1 segundo
atualizarRelogio();
atualizarData();

// setInterval repete a função a cada 1000 milissegundos (1 segundo)
// é isso que faz o relógio andar
setInterval(atualizarRelogio, 1000);