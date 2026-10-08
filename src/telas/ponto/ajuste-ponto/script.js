const formFiltros = document.getElementById("filterForm");   // <form> dos filtros
const selectColab = document.getElementById("colaborador");  // <select> de colaborador
const inputInicio = document.getElementById("dataInicio");   // data inicial ("De")
const inputFim    = document.getElementById("dataFim");      // data final ("Até")
const tableBody   = document.getElementById("tableBody");    // <tbody> (linhas entram aqui)
const totalPeriodo = document.getElementById("totalPeriodo"); // célula com o total do rodapé

// Quantidade de colunas da tabela (usada para a mensagem de "sem registros")
const TOTAL_COLUNAS = 8;

const registros = [
  { id: 1, colaborador: "Ana Souza",   data: "2026-09-28", entrada: "08:00", saidaIntervalo: "12:00", retornoIntervalo: "13:00", saida: "17:00" },
  { id: 2, colaborador: "Ana Souza",   data: "2026-09-29", entrada: "08:10", saidaIntervalo: "12:05", retornoIntervalo: "13:05", saida: "17:30" },
  { id: 3, colaborador: "Ana Souza",   data: "2026-09-30", entrada: "07:55", saidaIntervalo: "12:00", retornoIntervalo: "13:00", saida: "16:45" },
  { id: 4, colaborador: "Bruno Lima",  data: "2026-09-28", entrada: "09:00", saidaIntervalo: "12:30", retornoIntervalo: "13:30", saida: "18:00" },
  { id: 5, colaborador: "Bruno Lima",  data: "2026-09-29", entrada: "09:05", saidaIntervalo: "12:30", retornoIntervalo: "13:30", saida: "18:10" },
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
   Math.floor arredonda para baixo; "%" devolve o resto da divisão. */
function formatarHoras(totalMinutos) {
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  return String(horas).padStart(2, "0") + ":" + String(minutos).padStart(2, "0");
}

/* Converte "AAAA-MM-DD" em "DD/MM/AAAA" para exibir.
   Fazemos com split em vez de new Date() para evitar o bug de fuso
   horário, que às vezes mostra o dia anterior. */
function formatarData(iso) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

/* Calcula os minutos trabalhados em um registro.
   - Com intervalo: (intervalo - entrada) + (saída - retorno)
   - Sem intervalo: saída - entrada
   Se faltar algum horário essencial, devolve 0. */
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
   Pegamos os nomes dos registros, removemos repetidos e criamos uma
   <option> para cada um.
   ===================================================================== */
function preencherColaboradores() {
  // "Set" guarda valores únicos; "..." transforma de volta em array.
  const nomes = [...new Set(registros.map((r) => r.colaborador))];

  // Opção inicial: value vazio significa "sem filtro de colaborador"
  selectColab.innerHTML = '<option value="">Todos</option>';

  nomes.forEach((nome) => {
    const opcao = document.createElement("option"); // cria <option>
    opcao.value = nome;                             // valor enviado/lido
    opcao.textContent = nome;                       // texto visível
    selectColab.appendChild(opcao);                 // coloca dentro do <select>
  });
}


/* =====================================================================
   5) CRIAR UMA CÉLULA (<td>)
   Função pequena usada para montar cada coluna da linha.
     texto : o que aparece na célula
     rotulo: vai para data-label (o CSS usa no layout de celular)
     classe: classe CSS opcional (date, time, total...)
   Usamos textContent (e não innerHTML) por segurança: o texto nunca é
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

  const btnEditar = document.createElement("span");
  btnEditar.className = "material-symbols-outlined";
  btnEditar.textContent = "check";
  btnEditar.title = "Check";
  btnEditar.dataset.acao = "check";    
  btnEditar.dataset.id = reg.id;        
  btnEditar.tabIndex = 0;              

  const btnExcluir = document.createElement("span");
  btnExcluir.className = "material-symbols-outlined";
  btnExcluir.textContent = "close";
  btnExcluir.title = "Reprovar";
  btnExcluir.dataset.acao = "reprovar";
  btnExcluir.dataset.id = reg.id;
  btnExcluir.tabIndex = 0;

  tdAcoes.appendChild(btnEditar);
  tdAcoes.appendChild(btnExcluir);
  tr.appendChild(tdAcoes);

  return tr;
}

function renderizarTabela(lista) {
  tableBody.innerHTML = "";   // apaga as linhas antigas

  // Sem registros: mostra uma mensagem em uma única linha
  if (lista.length === 0) {
    const tr = document.createElement("tr");
    if (reg.status) tr.classList.add(reg.status);
    const td = document.createElement("td");
    td.colSpan = TOTAL_COLUNAS;               // ocupa todas as colunas
    td.className = "empty-state";             // estilo definido no CSS
    td.textContent = "Nenhum registro encontrado para o período.";
    tr.appendChild(td);
    tableBody.appendChild(tr);
    console.log(totalPeriodo, totalPeriodo);
    totalPeriodo.textContent = "00:00";
    return;
  }

  // Cria uma linha por registro e soma os minutos para o total
  let somaMinutos = 0;
  lista.forEach((reg) => {
    tableBody.appendChild(criarLinha(reg));
    somaMinutos += calcularMinutos(reg);
  });

  totalPeriodo.textContent = formatarHoras(somaMinutos);
}


/*
   FILTRAR
   Lê os valores dos campos e devolve só os registros que combinam.
   - Campo vazio = aquele filtro não é aplicado.
   - Datas no formato AAAA-MM-DD podem ser comparadas como texto
     (">=" e "<=") e a ordem fica correta. */
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

// Cliques nos ícones de ação.
// "Delegação de eventos": um único ouvinte no <tbody> atende todas as
// linhas, inclusive as criadas depois. Mais simples e eficiente do que
// colocar um ouvinte em cada ícone.
tableBody.addEventListener("click", (evento) => {
  const botao = evento.target.closest("[data-acao]");
  if (!botao) return;

  const id = Number(botao.dataset.id);
  const acao = botao.dataset.acao;

  // Procura o registro que tem esse id
  const registro = registros.find((r) => r.id === id);
  if (!registro) return;

  if (acao === "check") {
    registro.status = "aprovado";
    renderizarTabela(filtrarRegistros());
  }

  if (acao === "reprovar") {
    if (confirm("Deseja reprovar este registro?")) {
      registro.status = "reprovado";
      renderizarTabela(filtrarRegistros());
    }
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
   11) MENU PERSONALIZADO <my-menu> (OPCIONAL)
   Seu HTML tem a tag <my-menu>. Para ela funcionar, a classe precisa
   existir ANTES do customElements.define. O erro
   "MeuMenu is not defined" acontecia por faltar essa classe.

   Se você já tem a classe em outro arquivo, apague este bloco e use:
     import { MeuMenu } from "caminho/do/arquivo.js";
   (o import deve ficar no TOPO do script.js).

   Para testar com um menu simples, tire os comentários abaixo:

   class MeuMenu extends HTMLElement {
     connectedCallback() {          // roda quando a tag entra na página
       this.innerHTML = "<nav>Menu</nav>";
     }
   }
   customElements.define("my-menu", MeuMenu);
   ===================================================================== */