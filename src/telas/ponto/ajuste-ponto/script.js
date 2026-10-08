/* =====================================================================
   1) PEGAR OS ELEMENTOS DA PÁGINA
   Aqui eu guardo em variáveis os elementos do HTML que vou usar.
   O texto dentro do getElementById tem que ser IGUAL ao id do HTML,
   se errar uma letra o resultado é null e dá erro.
   ===================================================================== */
const formFiltros  = document.getElementById("filterForm");   // <form> dos filtros
const selectColab  = document.getElementById("colaborador");  // <select> de colaborador
const inputInicio  = document.getElementById("dataInicio");   // data inicial ("De")
const inputFim     = document.getElementById("dataFim");      // data final ("Até")
const tableBody    = document.getElementById("tableBody");    // <tbody> (linhas entram aqui)

// CORRIGIDO: antes o HTML não tinha o id "totalPeriodo",
// então essa variável virava null e o total nunca aparecia. Agora o HTML tem esse id.
const totalPeriodo = document.getElementById("totalPeriodo"); // célula com o total do rodapé

// Quantidade de colunas da tabela (usada para a mensagem de "sem registros")
const TOTAL_COLUNAS = 8;


/* =====================================================================
   2) DADOS DE EXEMPLO
   Por enquanto os registros estão aqui dentro, só pra testar.
   Depois dá pra trocar por dados que vêm de um servidor.
   ===================================================================== */
const registros = [
  { id: 1, colaborador: "Ana Souza",    data: "2026-09-28", entrada: "08:00", saidaIntervalo: "12:00", retornoIntervalo: "13:00", saida: "17:00" },
  { id: 2, colaborador: "Ana Souza",    data: "2026-09-29", entrada: "08:10", saidaIntervalo: "12:05", retornoIntervalo: "13:05", saida: "17:30" },
  { id: 3, colaborador: "Ana Souza",    data: "2026-09-30", entrada: "07:55", saidaIntervalo: "12:00", retornoIntervalo: "13:00", saida: "16:45" },
  { id: 4, colaborador: "Bruno Lima",   data: "2026-09-28", entrada: "09:00", saidaIntervalo: "12:30", retornoIntervalo: "13:30", saida: "18:00" },
  { id: 5, colaborador: "Bruno Lima",   data: "2026-09-29", entrada: "09:05", saidaIntervalo: "12:30", retornoIntervalo: "13:30", saida: "18:10" },
  // a Carla não tem intervalo registrado, serve pra testar esse caso
  { id: 6, colaborador: "Carla Mendes", data: "2026-09-30", entrada: "08:00", saidaIntervalo: "",      retornoIntervalo: "",      saida: "14:00" },
];


/* =====================================================================
   3) FUNÇÕES AUXILIARES (cálculo e formatação)
   ===================================================================== */

/* Converte "HH:MM" em minutos desde meia-noite.
   Ex.: "08:30" -> 8*60 + 30 = 510.
   Trabalhar em minutos deixa as contas de hora simples (só subtrair). */
function paraMinutos(hhmm) {
  const [horas, minutos] = hhmm.split(":").map(Number); // "08:30" -> [8, 30]
  return horas * 60 + minutos;
}

/* Converte minutos em texto "HH:MM".
   Ex.: 510 -> "08:30".
   padStart(2, "0") completa com zero à esquerda (8 -> "08").
   Math.floor arredonda para baixo; "%" devolve o resto da divisão.
   Obs.: as horas NÃO são limitadas a 24, assim um total de 176:30 funciona. */
function formatarHoras(totalMinutos) {
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  return String(horas).padStart(2, "0") + ":" + String(minutos).padStart(2, "0");
}

/* Converte "AAAA-MM-DD" em "DD/MM/AAAA" para exibir.
   Fiz com split em vez de new Date() pra evitar o bug de fuso
   horário, que às vezes mostra o dia anterior. */
function formatarData(iso) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

/* Calcula os minutos trabalhados em um registro.
   - Com intervalo: (saída p/ intervalo - entrada) + (saída - retorno)
   - Sem intervalo: saída - entrada
   Se faltar entrada ou saída, devolve 0. */
function calcularMinutos(reg) {
  if (!reg.entrada || !reg.saida) return 0;

  const entrada = paraMinutos(reg.entrada);
  const saida = paraMinutos(reg.saida);

  // Teve intervalo? Só se os dois horários do intervalo existirem.
  if (reg.saidaIntervalo && reg.retornoIntervalo) {
    const saidaInt = paraMinutos(reg.saidaIntervalo);
    const retorno = paraMinutos(reg.retornoIntervalo);
    return (saidaInt - entrada) + (saida - retorno);
  }

  return saida - entrada;
}


/* =====================================================================
   4) PREENCHER O SELECT DE COLABORADORES
   Pego os nomes dos registros, tiro os repetidos e crio uma <option>
   pra cada um.
   ===================================================================== */
function preencherColaboradores() {
  // "Set" guarda só valores únicos; "..." transforma de volta em array.
  const nomes = [...new Set(registros.map((r) => r.colaborador))];

  // Opção inicial: value vazio significa "sem filtro de colaborador"
  selectColab.innerHTML = '<option value="">Todos</option>';

  nomes.forEach((nome) => {
    const opcao = document.createElement("option"); // cria <option>
    opcao.value = nome;                             // valor lido pelo filtro
    opcao.textContent = nome;                       // texto visível
    selectColab.appendChild(opcao);                 // coloca dentro do <select>
  });
}


/* =====================================================================
   5) CRIAR UMA CÉLULA (<td>)
   Função pequena que uso pra montar cada coluna da linha.
     texto : o que aparece na célula
     rotulo: vai pro data-label (o CSS usa no layout de celular)
     classe: classe CSS opcional (date, time, total...)
   Uso textContent (e não innerHTML) por segurança: o texto nunca é
   interpretado como código HTML.
   ===================================================================== */
function criarCelula(texto, rotulo, classe) {
  const td = document.createElement("td");
  td.textContent = texto;
  td.dataset.label = rotulo;           // vira o atributo data-label="..."
  if (classe) td.classList.add(classe);
  return td;
}


/* =====================================================================
   6) CRIAR UMA LINHA COMPLETA (<tr>) PARA UM REGISTRO
   ===================================================================== */
function criarLinha(reg) {
  const tr = document.createElement("tr");

  // CORRIGIDO: esse "if" estava na função errada (a da mensagem de "sem registros"),
  // onde a variável "reg" nem existe e dava erro. O lugar certo é aqui.
  // Se o registro foi aprovado/reprovado, a linha ganha essa classe pra pintar no CSS.
  if (reg.status) tr.classList.add(reg.status);

  // Colunas na mesma ordem do cabeçalho da tabela
  tr.appendChild(criarCelula(reg.colaborador, "Colaborador"));
  tr.appendChild(criarCelula(formatarData(reg.data), "Data", "date"));
  tr.appendChild(criarCelula(reg.entrada || "--:--", "Entrada", "time"));
  tr.appendChild(criarCelula(reg.saidaIntervalo || "--:--", "Saída intervalo", "time"));
  tr.appendChild(criarCelula(reg.retornoIntervalo || "--:--", "Retorno intervalo", "time"));
  tr.appendChild(criarCelula(reg.saida || "--:--", "Saída", "time"));
  tr.appendChild(criarCelula(formatarHoras(calcularMinutos(reg)), "Horas trabalhadas", "total"));

  // Coluna de ações: dois ícones (aprovar e reprovar).
  const tdAcoes = document.createElement("td");
  tdAcoes.classList.add("acoes");

  // Ícone de aprovar (o "check").
  // Mudei o nome da variável de btnEditar pra btnAprovar, porque ele não edita nada.
  const btnAprovar = document.createElement("span");
  btnAprovar.className = "material-symbols-outlined"; // a fonte de ícones transforma o texto em desenho
  btnAprovar.textContent = "check";
  btnAprovar.title = "Aprovar";            // texto que aparece ao passar o mouse
  btnAprovar.dataset.acao = "check";       // o clique lá embaixo lê isso pra saber o que fazer
  btnAprovar.dataset.id = reg.id;          // e isso pra saber de qual registro é
  btnAprovar.tabIndex = 0;                 // deixa o ícone alcançável com a tecla Tab

  // Ícone de reprovar (o "close", um X)
  const btnReprovar = document.createElement("span");
  btnReprovar.className = "material-symbols-outlined";
  btnReprovar.textContent = "close";
  btnReprovar.title = "Reprovar";
  btnReprovar.dataset.acao = "reprovar";
  btnReprovar.dataset.id = reg.id;
  btnReprovar.tabIndex = 0;

  tdAcoes.appendChild(btnAprovar);
  tdAcoes.appendChild(btnReprovar);
  tr.appendChild(tdAcoes);

  return tr;
}


/* =====================================================================
   7) DESENHAR A TABELA
   Recebe uma lista de registros, apaga o que tinha e monta tudo de novo.
   Também atualiza o total do rodapé.
   ===================================================================== */
function renderizarTabela(lista) {
  tableBody.innerHTML = "";   // apaga as linhas antigas

  // Sem registros: mostra uma mensagem em uma única linha
  if (lista.length === 0) {
    const tr = document.createElement("tr");

    // CORRIGIDO: tirei o "if (reg.status)..." que estava aqui (dava erro, "reg" não existe)
    // e tirei o console.log que eu tinha esquecido de debug.

    const td = document.createElement("td");
    td.colSpan = TOTAL_COLUNAS;               // ocupa todas as colunas
    td.className = "empty-state";             // estilo definido no CSS
    td.textContent = "Nenhum registro encontrado para o período.";
    tr.appendChild(td);
    tableBody.appendChild(tr);

    totalPeriodo.textContent = "00:00";       // sem registros, total zerado
    return;                                   // para aqui, não precisa continuar
  }

  // Cria uma linha por registro e soma os minutos para o total
  let somaMinutos = 0;
  lista.forEach((reg) => {
    tableBody.appendChild(criarLinha(reg));
    somaMinutos += calcularMinutos(reg);
  });

  // Mostra o total no rodapé (agora funciona porque o id existe no HTML)
  totalPeriodo.textContent = formatarHoras(somaMinutos);
}


/* =====================================================================
   8) FILTRAR
   Lê os valores dos campos e devolve só os registros que combinam.
   - Campo vazio = aquele filtro não é aplicado.
   - Datas no formato AAAA-MM-DD podem ser comparadas como texto
     (">=" e "<=") e a ordem fica correta.
   ===================================================================== */
function filtrarRegistros() {
  const colab = selectColab.value;
  const inicio = inputInicio.value;
  const fim = inputFim.value;

  return registros.filter((reg) => {
    if (colab && reg.colaborador !== colab) return false;  // outro colaborador
    if (inicio && reg.data < inicio) return false;         // antes do início
    if (fim && reg.data > fim) return false;               // depois do fim
    return true;                                           // passou em tudo
  });
}


/* =====================================================================
   9) EVENTOS (reações às ações do usuário)
   ===================================================================== */

// Ao clicar em "Filtrar" (envio do formulário)
formFiltros.addEventListener("submit", (evento) => {
  evento.preventDefault();   // impede o navegador de recarregar a página
  renderizarTabela(filtrarRegistros());
});

// Função que trata o clique (ou Enter) num ícone de ação.
// Separei numa função só pra usar no clique e no teclado sem copiar código.
function tratarAcao(evento) {
  // closest sobe na árvore até achar o ícone que tem data-acao
  const botao = evento.target.closest("[data-acao]");
  if (!botao) return;   // clicou em outra coisa, ignora

  const id = Number(botao.dataset.id);   // dataset sempre vem como texto, converto pra número
  const acao = botao.dataset.acao;

  // Procura o registro que tem esse id
  const registro = registros.find((r) => r.id === id);
  if (!registro) return;

  if (acao === "check") {
    registro.status = "aprovado";
    renderizarTabela(filtrarRegistros());   // redesenha pra mostrar a cor nova
  }

  if (acao === "reprovar") {
    // confirm abre aquela janelinha de OK / Cancelar
    if (confirm("Deseja reprovar este registro?")) {
      registro.status = "reprovado";
      renderizarTabela(filtrarRegistros());
    }
  }
}

// "Delegação de eventos": um único ouvinte no <tbody> atende todas as
// linhas, inclusive as criadas depois. Mais simples do que colocar um
// ouvinte em cada ícone.
tableBody.addEventListener("click", tratarAcao);

// NOVO: os ícones são <span>, então Enter/Espaço não "clicam" sozinhos.
// Esse ouvinte faz o teclado funcionar também (quem navega com Tab).
tableBody.addEventListener("keydown", (evento) => {
  if (evento.key === "Enter" || evento.key === " ") {
    evento.preventDefault();   // evita a página rolar com a barra de espaço
    tratarAcao(evento);
  }
});


/* =====================================================================
   10) INICIALIZAÇÃO
   Roda uma vez quando a página carrega: preenche o select e mostra
   todos os registros.
   ===================================================================== */
preencherColaboradores();
renderizarTabela(registros);


/* =====================================================================
   11) SOBRE O MENU <my-menu>
   O menu é criado pelos arquivos da pasta ../components/menu/
   (carregados lá no <head> do HTML). Então NÃO precisa definir a classe aqui.
   Se aparecer "MeuMenu is not defined" no console (F12), o problema está
   nesses arquivos do menu e não neste script.
   ===================================================================== */