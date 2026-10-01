(function () {

    // ===== DADOS =====
    // Dados de exemplo. No projeto real virão de um backend/API.
    // Cada item é um dia de trabalho com os 4 horários batidos.
    const registros = [

    { colaborador: 'Ana Souza', data: '2026-09-15', entrada: '08:02', saidaAlmoco: '12:00', retornoAlmoco: '13:01', saida: '17:58' },
    { colaborador: 'Ana Souza', data: '2026-09-16', entrada: '08:05', saidaAlmoco: '12:03', retornoAlmoco: '13:00', saida: '18:10' },

    { colaborador: 'Bruno Lima', data: '2026-09-15', entrada: '09:00', saidaAlmoco: '12:30', retornoAlmoco: '13:30', saida: '18:05' },
    { colaborador: 'Bruno Lima', data: '2026-09-16', entrada: '08:55', saidaAlmoco: '12:28', retornoAlmoco: '13:32', saida: '18:00' },

    { colaborador: 'Carla Mendes', data: '2026-09-15', entrada: '07:30', saidaAlmoco: '11:30', retornoAlmoco: '12:30', saida: '16:35' },
    { colaborador: 'Carla Mendes', data: '2026-09-16', entrada: '07:28', saidaAlmoco: '11:32', retornoAlmoco: '12:31', saida: '16:30' },

    { colaborador: 'Diego Ferreira', data: '2026-09-15', entrada: '08:15', saidaAlmoco: '12:10', retornoAlmoco: '13:10', saida: '17:20' },
    { colaborador: 'Diego Ferreira', data: '2026-09-19', entrada: '08:12', saidaAlmoco: '12:10', retornoAlmoco: '13:08', saida: '16:55' }
];

    // ===== ELEMENTOS DA TELA =====
    const form = document.getElementById('filterForm');          // o formulário de filtros
    const tableBody = document.getElementById('tableBody');      // corpo da tabela (onde entram as linhas)
    const tfootTotal = document.getElementById('tfootTotal');    // célula do total de horas
    const emptyState = document.getElementById('emptyState');    // aviso "nenhum lançamento"
    const selectColaborador = document.getElementById('colaborador'); // NOVO: a caixa de seleção

    // ===== FUNÇÕES DE CONVERSÃO DE HORÁRIO =====

    // Converte "08:30" em minutos desde meia-noite (510).
    // Com minutos fica fácil somar e subtrair horários.
    function paraMinutos(hhmm) {
        const [h, m] = hhmm.split(':').map(Number); // separa em ["08","30"] e converte para número
        return h * 60 + m;
    }

    // Faz o contrário: converte minutos em "HH:MM" (510 vira "08:30").
    // Aceita valor negativo e coloca o sinal "-" na frente.
    function paraHHMM(minutosTotais) {
        const sinal = minutosTotais < 0 ? '-' : '';
        const abs = Math.abs(minutosTotais);
        const h = Math.floor(abs / 60);   // horas inteiras
        const m = abs % 60;               // minutos que sobraram
        return `${sinal}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    // Calcula quantos minutos o colaborador trabalhou no dia:
    // (saída almoço - entrada) + (saída - retorno almoço)
    function horasTrabalhadasMin(r) {
        const manha = paraMinutos(r.saidaAlmoco) - paraMinutos(r.entrada);
        const tarde = paraMinutos(r.saida) - paraMinutos(r.retornoAlmoco);
        return manha + tarde;
    }

    // Converte a data "2026-09-15" para o formato brasileiro "15/09/2026"
    function formatarData(iso) {
        const [ano, mes, dia] = iso.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    // ===== NOVO: PREENCHER A LISTA DE COLABORADORES =====
    function preencherColaboradores() {
        // Pega o nome de cada registro. O Set remove os repetidos,
        // e o sort() coloca em ordem alfabética.
        const nomes = [...new Set(registros.map(r => r.colaborador))].sort();

        nomes.forEach(nome => {
            const option = document.createElement('option'); // cria uma <option>
            option.value = nome;                             // valor usado no filtro
            option.textContent = nome;                       // texto que aparece na tela
            selectColaborador.appendChild(option);           // adiciona no <select>
        });
    }

    // ===== DESENHAR A TABELA =====
    function render(lista) {
        tableBody.innerHTML = ''; // limpa as linhas antigas

        // Se não há nada para mostrar, exibe o aviso e zera o total
        if (lista.length === 0) {
            emptyState.style.display = 'block';
            tfootTotal.textContent = '00:00';
            return; // para a função aqui
        }

        emptyState.style.display = 'none'; // esconde o aviso

        let totalMin = 0; // acumulador do total de minutos do período

        lista
            .slice()                                            // cópia, para não alterar o original
            .sort((a, b) => (a.data < b.data ? -1 : 1))         // ordena da data mais antiga para a mais nova
            .forEach(r => {
                const minutos = horasTrabalhadasMin(r); // minutos trabalhados neste dia
                totalMin += minutos;                    // soma no total

                const tr = document.createElement('tr'); // cria uma linha
                // Monta as células. O data-label é usado pelo CSS no celular,
                // para mostrar o nome da coluna ao lado de cada valor.
                tr.innerHTML = `
          <td class="date" data-label="Data">${formatarData(r.data)}</td>
          <td class="time" data-label="Entrada">${r.entrada}</td>
          <td class="time" data-label="Saída almoço">${r.saidaAlmoco}</td>
          <td class="time" data-label="Retorno almoço">${r.retornoAlmoco}</td>
          <td class="time" data-label="Saída">${r.saida}</td>
          <td class="total" data-label="Horas trabalhadas">${paraHHMM(minutos)}</td>
          <td class="acoes" data-label="Ações">
            <span class="material-symbols-outlined">edit</span>
          </td>
        `;
                tableBody.appendChild(tr); // coloca a linha na tabela
            });

        tfootTotal.textContent = paraHHMM(totalMin); // mostra o total no rodapé
    }

    // ===== FILTROS =====
    function aplicarFiltros() {
        // Lê o que a pessoa escolheu nos campos
        const colaborador = selectColaborador.value;               // NOVO
        const dataInicio = document.getElementById('dataInicio').value;
        const dataFim = document.getElementById('dataFim').value;

        // filter() mantém só os registros que passam em TODAS as condições.
        // Campo vazio = sem filtro naquele critério.
        // Datas no formato ISO (aaaa-mm-dd) podem ser comparadas como texto.
        const filtrados = registros.filter(r =>
            (colaborador === '' || r.colaborador === colaborador) &&  // NOVO
            (dataInicio === '' || r.data >= dataInicio) &&
            (dataFim === '' || r.data <= dataFim)
        );

        render(filtrados); // desenha só os registros filtrados
    }

    // Quando clicar em "Filtrar"...
    form.addEventListener('submit', e => {
        e.preventDefault(); // impede a página de recarregar
        aplicarFiltros();   // aplica os filtros
    });

    // ===== AO ABRIR A PÁGINA =====
    preencherColaboradores(); // NOVO: preenche o <select>
    aplicarFiltros();         // mostra a tabela já na abertura
})();