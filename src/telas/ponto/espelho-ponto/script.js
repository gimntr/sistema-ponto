(function () {

    // Sem o id não dá pra saber qual linha a pessoa quer editar.
    const registros = [
        { id: 1, colaborador: 'Ana Souza', data: '2026-09-15', entrada: '08:02', saidaAlmoco: '12:00', retornoAlmoco: '13:01', saida: '17:58' },
        { id: 2, colaborador: 'Ana Souza', data: '2026-09-16', entrada: '08:05', saidaAlmoco: '12:03', retornoAlmoco: '13:00', saida: '18:10' },
        { id: 3, colaborador: 'Bruno Lima', data: '2026-09-15', entrada: '09:00', saidaAlmoco: '12:30', retornoAlmoco: '13:30', saida: '18:05' },
        { id: 4, colaborador: 'Bruno Lima', data: '2026-09-16', entrada: '08:55', saidaAlmoco: '12:28', retornoAlmoco: '13:32', saida: '18:00' },
        { id: 5, colaborador: 'Carla Mendes', data: '2026-09-15', entrada: '07:30', saidaAlmoco: '11:30', retornoAlmoco: '12:30', saida: '16:35' },
        { id: 6, colaborador: 'Carla Mendes', data: '2026-09-16', entrada: '07:28', saidaAlmoco: '11:32', retornoAlmoco: '12:31', saida: '16:30' },
        { id: 7, colaborador: 'Diego Ferreira', data: '2026-09-15', entrada: '08:15', saidaAlmoco: '12:10', retornoAlmoco: '13:10', saida: '17:20' },
        { id: 8, colaborador: 'Diego Ferreira', data: '2026-09-19', entrada: '08:12', saidaAlmoco: '12:10', retornoAlmoco: '13:08', saida: '16:55' }
    ];

    // guarda o id do registro que está sendo editado agora
    let idEditando = null;
    // guarda a lista que está na tela agora (para exportar o que está filtrado)
    let listaAtual = [];

    // ===== ELEMENTOS DA TELA =====
    const form = document.getElementById('filterForm');
    const tableBody = document.getElementById('tableBody');
    const tfootTotal = document.getElementById('tfootTotal');
    const emptyState = document.getElementById('emptyState');
    const selectColaborador = document.getElementById('colaborador');

    // elementos da janelinha de edição (o <dialog> do HTML)
    const modalEditar = document.getElementById('modalEditar');
    const formEditar = document.getElementById('formEditar');
    const editEntrada = document.getElementById('editEntrada');
    const editSaidaAlmoco = document.getElementById('editSaidaAlmoco');
    const editRetornoAlmoco = document.getElementById('editRetornoAlmoco');
    const editSaida = document.getElementById('editSaida');
    const btnCancelar = document.getElementById('btnCancelar');

    // ===== FUNÇÕES DE HORÁRIO =====

    // "08:30" vira 510 (minutos desde meia-noite)
    function paraMinutos(hhmm) {
        const [h, m] = hhmm.split(':').map(Number);
        return h * 60 + m;
    }

    // 510 vira "08:30". Se for negativo, coloca "-" na frente
    function paraHHMM(minutosTotais) {
        const sinal = minutosTotais < 0 ? '-' : '';
        const abs = Math.abs(minutosTotais);
        const h = Math.floor(abs / 60);
        const m = abs % 60;
        return `${sinal}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    // (saída almoço - entrada) + (saída - retorno almoço)
    function horasTrabalhadasMin(r) {
        const manha = paraMinutos(r.saidaAlmoco) - paraMinutos(r.entrada);
        const tarde = paraMinutos(r.saida) - paraMinutos(r.retornoAlmoco);
        return manha + tarde;
    }

    // "2026-09-15" vira "15/09/2026"
    function formatarData(iso) {
        const [ano, mes, dia] = iso.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    // ===== PREENCHER A LISTA DE COLABORADORES =====
    function preencherColaboradores() {
        // Set tira os nomes repetidos, sort() põe em ordem alfabética
        const nomes = [...new Set(registros.map(r => r.colaborador))].sort();

        // começa com a opção "Todos" (value vazio = sem filtro)
        selectColaborador.innerHTML = '<option value="">Todos</option>';

        nomes.forEach(nome => {
            const option = document.createElement('option');
            option.value = nome;
            option.textContent = nome;
            selectColaborador.appendChild(option);
        });
    }

    // ===== DESENHAR A TABELA =====
    function render(lista) {
        listaAtual = lista;
        tableBody.innerHTML = '';

        // sem registros: mostra o aviso e zera o total
        if (lista.length === 0) {
            emptyState.style.display = 'block';
            tfootTotal.textContent = '00:00';
            return;
        }

        emptyState.style.display = 'none';

        let totalMin = 0;

        lista
            .slice()                                    // cópia pra não mexer no original
            .sort((a, b) => (a.data < b.data ? -1 : 1)) // data mais antiga primeiro
            .forEach(r => {
                const minutos = horasTrabalhadasMin(r);
                totalMin += minutos;

                const tr = document.createElement('tr');

                // O lápis agora tem data-acao="editar" e data-id.
                // É assim que o clique sabe QUAL linha é.
                tr.innerHTML = `
                    <td class="date" data-label="Data">${formatarData(r.data)}</td>
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
                tableBody.appendChild(tr);
            });

        tfootTotal.textContent = paraHHMM(totalMin);
    }

    // ===== FILTROS =====
    function aplicarFiltros() {
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

    // ===== CLIQUE NO LÁPIS =====
    // Um ouvinte só no <tbody> atende todas as linhas,
    // inclusive as que o JavaScript cria depois.
    tableBody.addEventListener('click', e => {
        // procura o elemento clicado que tenha data-acao
        const botao = e.target.closest('[data-acao]');
        if (!botao) return; // clicou em outra coisa, ignora

        const id = Number(botao.dataset.id);
        const acao = botao.dataset.acao;

        // acha o registro que tem esse id
        const registro = registros.find(r => r.id === id);
        if (!registro) return;

        if (acao === 'editar') {
            idEditando = id; // lembra quem estamos editando

            // preenche a janelinha com os horários atuais
            editEntrada.value = registro.entrada;
            editSaidaAlmoco.value = registro.saidaAlmoco;
            editRetornoAlmoco.value = registro.retornoAlmoco;
            editSaida.value = registro.saida;

            modalEditar.showModal(); // abre a janelinha
        }
    });

    // ===== SALVAR A EDIÇÃO =====
    formEditar.addEventListener('submit', e => {
        e.preventDefault(); // não deixa a página recarregar

        const registro = registros.find(r => r.id === idEditando);
        if (!registro) return;

        // troca os horários antigos pelos novos
        registro.entrada = editEntrada.value;
        registro.saidaAlmoco = editSaidaAlmoco.value;
        registro.retornoAlmoco = editRetornoAlmoco.value;
        registro.saida = editSaida.value;

        modalEditar.close();  // fecha a janelinha
        aplicarFiltros();     // redesenha mantendo os filtros e recalcula o total
    });

    // ===== CANCELAR =====
    btnCancelar.addEventListener('click', () => {
        modalEditar.close(); // só fecha, não salva nada
    });

    // ===== FILTRAR =====
    form.addEventListener('submit', e => {
        e.preventDefault();
        aplicarFiltros();
    });

    // ===== EXPORTAR PARA EXCEL =====
    document.getElementById('btnExportar').addEventListener('click', () => {
        if (listaAtual.length === 0) {
            alert('Não há registros para exportar.');
            return;
        }

        const ordenada = listaAtual.slice().sort((a, b) => (a.data < b.data ? -1 : 1));

        let totalMin = 0;
        const linhas = [
            ['Colaborador', 'Data', 'Entrada', 'Saída almoço', 'Retorno almoço', 'Saída', 'Horas trabalhadas']
        ];

        ordenada.forEach(r => {
            const minutos = horasTrabalhadasMin(r);
            totalMin += minutos;
            linhas.push([
                r.colaborador,
                formatarData(r.data),
                r.entrada,
                r.saidaAlmoco,
                r.retornoAlmoco,
                r.saida,
                paraHHMM(minutos)
            ]);
        });

        linhas.push(['Total do período', '', '', '', '', '', paraHHMM(totalMin)]);

        const planilha = XLSX.utils.aoa_to_sheet(linhas);
        planilha['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 18 }];

        const livro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(livro, planilha, 'Espelho de Ponto');
        XLSX.writeFile(livro, `espelho-de-ponto-${new Date().toISOString().slice(0, 10)}.xlsx`);
    });

    // ===== AO ABRIR A PÁGINA =====
    preencherColaboradores();
    aplicarFiltros();
})();