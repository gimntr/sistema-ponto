(async function () {
    /*
      Esta é uma "função que se executa sozinha" (IIFE).
      Os parênteses no começo e o () no final fazem o JavaScript
      criar a função e rodá-la imediatamente. */

    // BUSCAR OS DADOS NO SERVIDOR

    const requestOptions = {
        method: "GET",       // GET = "quero apenas LER dados" (não enviar nada)
        redirect: "follow"   // se o servidor redirecionar, siga o novo endereço
    };

    const response = await fetch(
        "http://localhost:3000/registroPontoEstag/espelho-ponto?userCode=0&dataInicio=2026-01-01&dataFim=2026-11-11",
        requestOptions
    )
        .then((response) => response.json());

    console.log('Resposta do servidor:', response);
    // Mostra a resposta no Console do navegador (F12). Ótimo para
    // descobrir o formato dos dados enquanto você desenvolve.

    const registros = response.data;

    // VARIÁVEIS QUE GUARDAM O "ESTADO" DA PÁGINA 

    // guarda o id do registro que está sendo editado agora
    let idEditando = null;
    // "let" (e não "const") porque o valor vai mudar ao longo do tempo.
    // null = "nenhum registro sendo editado por enquanto".

    // guarda a lista que está na tela agora (para exportar o que está filtrado)
    let listaAtual = [];
    // Começa como lista vazia []. É atualizada toda vez que a tabela é desenhada.

    // ELEMENTOS DA TELA
    /*
      document.getElementById("x") procura no HTML o elemento com id="x".
      Guardamos em variáveis para não precisar procurar de novo toda hora.
      Os ids abaixo são os mesmos que escrevemos no HTML.
    */
    const form = document.getElementById('filterForm');           // formulário de filtros
    const tableBody = document.getElementById('tableBody');       // corpo da tabela (começa vazio)
    const tfootTotal = document.getElementById('tfootTotal');     // célula do total de horas
    const emptyState = document.getElementById('emptyState');     // aviso "nenhum lançamento"
    const selectColaborador = document.getElementById('colaborador'); // dropdown de colaboradores

    // elementos da janelinha de edição (o <dialog> do HTML)
    const modalEditar = document.getElementById('modalEditar');          // a janelinha em si
    const formEditar = document.getElementById('formEditar');            // formulário dentro dela
    const editEntrada = document.getElementById('editEntrada');          // campo "Entrada"
    const editSaidaAlmoco = document.getElementById('editSaidaAlmoco');  // campo "Saída almoço"
    const editRetornoAlmoco = document.getElementById('editRetornoAlmoco'); // campo "Retorno almoço"
    const editSaida = document.getElementById('editSaida');              // campo "Saída"
    const btnCancelar = document.getElementById('btnCancelar');          // botão "Cancelar"

    // FUNÇÕES DE HORÁRIO
    /*
      Computadores calculam melhor com números do que com texto.
      Por isso convertemos "08:30" em minutos, fazemos as contas
      e depois convertemos de volta para "hh:mm" para mostrar.
    */

    // "08:30" vira 510 (minutos desde meia-noite)
    function paraMinutos(hhmm) {
        const [h, m] = hhmm.split(':').map(Number);
        /*
          .split(':') quebra o texto no ":" -> "08:30" vira ["08", "30"]
          .map(Number) transforma cada pedaço em número -> [8, 30]
          "const [h, m] = ..." (desestruturação) coloca o primeiro valor
          em "h" e o segundo em "m".
        */
        return h * 60 + m; // 8 * 60 + 30 = 510
    }

    // 510 vira "08:30". Se for negativo, coloca "-" na frente
    function paraHHMM(minutosTotais) {
        const sinal = minutosTotais < 0 ? '-' : '';
        // Operador ternário: "condição ? valor se verdadeiro : valor se falso"
        const abs = Math.abs(minutosTotais);       // valor absoluto (tira o sinal negativo)
        const h = Math.floor(abs / 60);            // horas inteiras (arredonda para baixo)
        const m = abs % 60;                        // "%" = resto da divisão = minutos que sobraram
        return `${sinal}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        /*
          padStart(2, '0') completa com zero à esquerda até ter 2 dígitos:
          "5" vira "05". Assim ficamos com "08:05" em vez de "8:5".
          As crases ` ` permitem montar texto com ${variáveis} dentro.
        */
    }

    // (saída almoço - entrada) + (saída - retorno almoço)
    function horasTrabalhadasMin(r) {
        const manha = paraMinutos(r.saidaAlmoco) - paraMinutos(r.entrada);
        // período da manhã: do começo do trabalho até a ida para o almoço
        const tarde = paraMinutos(r.saida) - paraMinutos(r.retornoAlmoco);
        // período da tarde: da volta do almoço até ir embora
        return manha + tarde; // total trabalhado no dia, em minutos
        // (ex.: entra 22:00, sai 06:00), pois o resultado ficaria negativo.
    }

    // PREENCHER A LISTA DE COLABORADORES 
    function preencherColaboradores() {
        // Set tira os nomes repetidos, sort() põe em ordem alfabética
        const nomes = [...new Set(registros.map(r => r.colaborador))].sort();
        /*
          Passo a passo:
          1) registros.map(r => r.colaborador) -> lista só com os nomes
             (com repetições: ["Ana", "Ana", "Bruno", "Ana"])
          2) new Set(...) -> remove os repetidos (Ana, Bruno)
          3) [...] -> transforma o Set de volta em uma lista comum
          4) .sort() -> ordem alfabética
        */

        // começa com a opção "Todos" (value vazio = sem filtro)
        selectColaborador.innerHTML = '<option value="">Todos</option>';
        // innerHTML substitui TUDO que havia dentro do <select>.

        nomes.forEach(nome => {
            // forEach repete o bloco abaixo para cada nome da lista
            const option = document.createElement('option');
            // cria um novo elemento <option> na memória (ainda não está na tela)
            option.value = nome;          // valor interno da opção
            option.textContent = nome;    // texto que o usuário vê
            selectColaborador.appendChild(option);
            // agora sim: coloca a opção dentro do <select>
        });
    }

    // DESENHAR A TABELA 
    function render(lista) {
        listaAtual = lista;       // guarda o que está na tela (usado na exportação)
        tableBody.innerHTML = ''; // limpa as linhas antigas antes de redesenhar

        // sem registros: mostra o aviso e zera o total
        if (lista.length === 0) {
            emptyState.style.display = 'block'; // mostra a mensagem de "nada encontrado"
            tfootTotal.textContent = '00:00';   // zera o total
            return;                             // "return" encerra a função aqui
        }

        emptyState.style.display = 'none'; // tem registros: esconde o aviso

        let totalMin = 0; // acumulador: soma os minutos de todos os dias

        lista
            .slice()                                    // cópia pra não mexer no original
            .sort((a, b) => (a.data < b.data ? -1 : 1)) // data mais antiga primeiro
            /*
              sort() com função: se retornar -1, "a" vem antes de "b";
              se retornar 1, "a" vem depois.
              Comparar texto funciona aqui porque as datas estão no formato
              "AAAA-MM-DD" (ano primeiro), então a ordem alfabética
              é igual à ordem cronológica.
              O .slice() faz uma cópia: sort() altera a lista original,
              e não queremos bagunçar a ordem dos "registros".
            */
            .forEach(r => {
                const minutos = horasTrabalhadasMin(r); // horas do dia, em minutos
                totalMin += minutos;                    // soma ao total (+= significa "some a")

                const tr = document.createElement('tr'); // cria uma linha nova da tabela

                // O lápis agora tem data-acao="editar" e data-id.
                // É assim que o clique sabe QUAL linha é.
                tr.innerHTML = `
          <td class="date" data-label="Data">${r.data}</td>
          <td class="time" data-label="Entrada">${r.entrada}</td>
          <td class="time" data-label="Saída almoço">${r.saidaAlmoco}</td>
          <td class="time" data-label="Retorno almoço">${r.retornoAlmoco}</td>
          <td class="time" data-label="Saída">${r.saida}</td>
          <td class="total" data-label="Horas trabalhadas">${paraHHMM(minutos)}</td>
          <td class="acoes" data-label="Ações">
            <span class="material-symbols-outlined"
                  data-acao="editar"
                  data-id="${r.id}"
                  title="Editar"
                  tabindex="0">edit</span>
          </td>
        `;
                tableBody.appendChild(tr); // coloca a linha pronta dentro da tabela
            });

        tfootTotal.textContent = paraHHMM(totalMin); // mostra o total no rodapé
    }

    // ===== FILTROS =====
    function aplicarFiltros() {
        // lê o que a pessoa escolheu nos campos
        const colaborador = selectColaborador.value;
        const dataInicio = document.getElementById('dataInicio').value;
        const dataFim = document.getElementById('dataFim').value;

        // campo vazio = não filtra por ele
        const filtrados = registros.filter(r =>
            (colaborador === '' || r.colaborador === colaborador) &&
            (dataInicio === '' || r.data >= dataInicio) &&
            (dataFim === '' || r.data <= dataFim)
        );

        render(filtrados); // desenha só os filtrados
    } 

    // CLIQUE NO LÁPIS
    // Um ouvinte só no <tbody> atende todas as linhas,
    // inclusive as que o JavaScript cria depois.
    tableBody.addEventListener('click', async e => {
    

        // procura o elemento clicado que tenha data-acao
        const botao = e.target.closest('[data-acao]');
        // e.target = o que foi clicado exatamente.
        // closest() sobe na hierarquia até achar algo com data-acao.

        if (!botao) return; // clicou em outra coisa, ignora

        const id = botao.dataset.id;     // lê o data-id do lápis
        const acao = botao.dataset.acao; // lê o data-acao ("editar")

        // acha o registro que tem esse id
        const registro = registros.find(r => r.id === id);

        if (!registro) return; // não achou? não faz nada

        if (acao === 'editar') {
            idEditando = id; // lembra quem estamos editando

            // preenche a janelinha com os horários atuais
            editEntrada.value = registro.entrada;
            editSaidaAlmoco.value = registro.saidaAlmoco;
            editRetornoAlmoco.value = registro.retornoAlmoco;
            editSaida.value = registro.saida;

            modalEditar.showModal(); // abre a janelinha
            // showModal() é um método nativo do <dialog>: abre como pop-up
            // e escurece o fundo.
        }
    });

    // SALVAR A EDIÇÃO 
    formEditar.addEventListener('submit', async e => {
        e.preventDefault(); // não deixa a página recarregar
        // Todo formulário, por padrão, recarrega a página ao ser enviado.
        // preventDefault() cancela esse comportamento padrão.

        const registro = registros.find(r => r.id === idEditando);
        // procura o registro que estava sendo editado 
        if (!registro) return;

        // troca os horários antigos pelos novos
        registro.entrada = editEntrada.value;
        registro.saidaAlmoco = editSaidaAlmoco.value;
        registro.retornoAlmoco = editRetornoAlmoco.value;
        registro.saida = editSaida.value;

        // (O endereço e o formato exato dependem da sua API.)

        modalEditar.close();  // fecha a janelinha
        aplicarFiltros();     // redesenha mantendo os filtros e recalcula o total
    });

    // CANCELAR
    btnCancelar.addEventListener('click', async () => {
        modalEditar.close(); // só fecha, não salva nada
        // (de novo, o "async" aqui não é necessário)
    });

    // FILTRAR 
    form.addEventListener('submit', e => {
        e.preventDefault(); // evita recarregar a página
        aplicarFiltros();   // aplica os filtros escolhidos
    });

    // EXPORTAR PARA EXCEL
    document.getElementById('btnExportar').addEventListener('click', async () => {
        // Se não há nada na tela, avisa e para.
        if (listaAtual.length === 0) {
            alert('Não há registros para exportar.'); // caixinha de aviso do navegador
            return;
        }

        // ordena do mais antigo para o mais novo (igual à tabela da tela)
        const ordenada = listaAtual.slice().sort((a, b) => (a.data < b.data ? -1 : 1));

        let totalMin = 0;

        // "aoa" = array of arrays (lista de listas): cada lista interna
        // é uma LINHA da planilha. A primeira é o cabeçalho.
        const linhas = [
            ['Colaborador', 'Data', 'Entrada', 'Saída almoço', 'Retorno almoço', 'Saída', 'Horas trabalhadas']
        ];

        ordenada.forEach(r => {
            const minutos = horasTrabalhadasMin(r);
            totalMin += minutos;
            // adiciona uma linha com os dados deste registro
            linhas.push([
                r.colaborador,
                r.data,
                r.entrada,
                r.saidaAlmoco,
                r.retornoAlmoco,
                r.saida,
                paraHHMM(minutos)
            ]);
        });

        // última linha: o total (as aspas vazias deixam as células em branco)
        linhas.push(['Total do período', '', '', '', '', '', paraHHMM(totalMin)]);

        const planilha = XLSX.utils.aoa_to_sheet(linhas);
        // transforma a lista de listas em uma "planilha" (usa a biblioteca XLSX
        // carregada no HTML)

        planilha['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 18 }];
        // define a largura de cada coluna (wch = quantidade de caracteres)

        const livro = XLSX.utils.book_new();
        // cria o "livro" (arquivo Excel), que pode ter várias abas

        XLSX.utils.book_append_sheet(livro, planilha, 'Espelho de Ponto');
        // adiciona a planilha ao livro, com o nome de aba "Espelho de Ponto"

        XLSX.writeFile(livro, `espelho-de-ponto-${new Date().toISOString().slice(0, 10)}.xlsx`);

    });

    // AO ABRIR A PÁGINA 
    preencherColaboradores(); // monta a lista de colaboradores no dropdown
    aplicarFiltros();         // desenha a tabela pela primeira vez
})(); 