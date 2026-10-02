customElements.define("meu-menu", MeuMenu);
    // Dados de exemplo — substitua pelos lançamentos reais vindos do seu backend/API.
    // Cada registro representa um dia com os 4 horários batidos pelo colaborador.
    const registros = [
        { id_linha: 1, colaborador: 'Ana Souza', data: '2026-09-15', entrada: '08:02', saidaAlmoco: '12:00', retornoAlmoco: '13:01', saida: '17:58' },
        { id_linha: 2, colaborador: 'Ana Souza', data: '2026-09-16', entrada: '08:05', saidaAlmoco: '12:03', retornoAlmoco: '13:00', saida: '18:10' },
        { id_linha: 3, colaborador: 'Ana Souza', data: '2026-09-17', entrada: '07:59', saidaAlmoco: '12:01', retornoAlmoco: '12:58', saida: '17:55' },
        { id_linha: 4, colaborador: 'Ana Souza', data: '2026-09-18', entrada: '08:10', saidaAlmoco: '12:05', retornoAlmoco: '13:05', saida: '18:02' },
        { id_linha: 5, colaborador: 'Ana Souza', data: '2026-09-19', entrada: '08:00', saidaAlmoco: '12:00', retornoAlmoco: '13:00', saida: '17:30' },
        { id_linha: 6, colaborador: 'Bruno Lima', data: '2026-09-15', entrada: '08:30', saidaAlmoco: '12:15', retornoAlmoco: '13:15', saida: '18:00' },
        { id_linha: 7, colaborador: 'Bruno Lima', data: '2026-09-16', entrada: '08:28', saidaAlmoco: '12:10', retornoAlmoco: '13:12', saida: '18:05' },
        { id_linha: 8, colaborador: 'Bruno Lima', data: '2026-09-17', entrada: '08:35', saidaAlmoco: '12:20', retornoAlmoco: '13:10', saida: '17:50' },
        { id_linha: 9, colaborador: 'Carla Mendes', data: '2026-09-15', entrada: '09:00', saidaAlmoco: '13:00', retornoAlmoco: '14:00', saida: '18:30' },
        { id_linha: 10, colaborador: 'Carla Mendes', data: '2026-09-16', entrada: '08:55', saidaAlmoco: '12:58', retornoAlmoco: '14:02', saida: '18:20' }
    ];

    const form = document.getElementById('filterForm');
    const tableBody = document.getElementById('tableBody');
    const tfootTotal = document.getElementById('tfootTotal');
    const emptyState = document.getElementById('emptyState');
    const colaboradorSelect = document.getElementById('colaborador');

    // 1. Pega só os nomes, sem repetir
    const nomesUnicos = [];
    for (const registro of registros) {
        //Verifica se o nome já existe na lista
        if (nomesUnicos.includes(registro.colaborador) == false) {
            //Se não existir adiciona
            nomesUnicos.push(registro.colaborador);
        }
    }

    // 2. Ordena em ordem alfabética
    nomesUnicos.sort();

    // 3. Cria uma <option> para cada nome
    for (const nome of nomesUnicos) {
        const opt = document.createElement('option');
        opt.value = nome;
        opt.textContent = nome;
        colaboradorSelect.appendChild(opt);
    }

    function paraMinutos(hhmm) {
        const [h, m] = hhmm.split(':').map(Number);
        return h * 60 + m;
    }

    function paraHHMM(minutosTotais) {
        const sinal = minutosTotais < 0 ? '-' : '';
        const abs = Math.abs(minutosTotais);
        const h = Math.floor(abs / 60);
        const m = abs % 60;
        return `${sinal}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    function horasTrabalhadasMin(r) {
        const manha = paraMinutos(r.saidaAlmoco) - paraMinutos(r.entrada);
        const tarde = paraMinutos(r.saida) - paraMinutos(r.retornoAlmoco);
        return manha + tarde;
    }

    function formatarData(iso) {
        const [ano, mes, dia] = iso.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    function carregarListaTela(lista) {
        /*Limpa tudo que existe dentro da table principal da tela definida na variavel
        const tableBody = document.getElementById('tableBody') */
        tableBody.innerHTML = '';

        /*Verifica se a lista recebida pelo parâmetro está vazia para retornar
        alguma mensagem ou tratamento de que não foram encontrados registros*/
        if (lista.length === 0) {
            emptyState.style.display = 'block';
            tfootTotal.textContent = '00:00';
            return;
        }

        emptyState.style.display = 'none';

        let totalMin = 0;

        lista
            .slice()
            .sort((a, b) => (a.data < b.data ? -1 : 1))
            .forEach(r => {
                const minutos = horasTrabalhadasMin(r);
                totalMin += minutos;

                const tr = document.createElement('tr');
                tr.innerHTML = `
            <td class="id-registro" data-label="">${r.id_linha}</td>
            <td class="time" data-label="Colaborador">${r.colaborador}</td>
            <td class="date" data-label="Data">${formatarData(r.data)}</td>
            <td class="time" data-label="Entrada">${r.entrada} > ${r.retornoAlmoco}</td>
            <td class="time" data-label="Saída almoço">${r.saidaAlmoco} > ${r.saida}</td>
            <td class="time" data-label="Retorno almoço">${r.retornoAlmoco}</td>
            <td class="time" data-label="Saída">${r.saida}</td>
            <td class="total" data-label="Horas trabalhadas">${paraHHMM(minutos)}</td>
            <td class="acoes" data-label="Acoes">
              <span class="material-symbols-outlined">check</span>
              <span class="material-symbols-outlined">close</span>  
            </td>
          `;
                tableBody.appendChild(tr);
            });
        tfootTotal.textContent = paraHHMM(totalMin);
    }

    function aplicarFiltros() {
        /*Coleta o valor inputado no filtro colaborador através da variavel
        colaboradorSelect que armazena o componente select do filtro
        const colaboradorSelect = document.getElementById('colaborador') */
        const colaborador = colaboradorSelect.value;
        //Coleta o valor inputado no filtro de data inicio
        const dataInicio = document.getElementById('dataInicio').value;
        //Coleta o valor inputado no filtro de data fim
        const dataFim = document.getElementById('dataFim').value;

        /*Utiliza a function nativa (filter) para filtrar a lista registros de 
        acordo com as variaveis do filtro definidas acima */
        const filtrados = registros.filter(r => {
            /*verifica primeiro se a variavel está preenchida e também se satifaz
            a condição de busca para cada registro */
            if (
                (colaborador == '' || r.colaborador == colaborador) &&
                (dataInicio == '' || r.data >= dataInicio) &&
                (dataFim == '' || r.data <= dataFim)
            ) return true;
            return false;
        });
        //Invoca a function responsavel por carregar os elementos na tela com HTML
        carregarListaTela(filtrados);
    }

    /*Adiciona uma "escuta" no botão submit da variavel "form"
    que esta recebendo o <form> dos filtros: document.getElementById('filterForm')*/
    form.addEventListener('submit', e => {
        //Remove o comportamento de recarregar a tela do navegador ao clicar no submit do form
        e.preventDefault();
        //Executa a ação de filtrar a lista e carregar o resultado na tela através do innerHTML
        aplicarFiltros();
    });