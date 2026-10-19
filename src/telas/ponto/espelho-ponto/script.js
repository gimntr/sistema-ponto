// Uma IIFE: essa função que se chama sozinha serve para criar uma "bolha".
// Nada do que está aqui dentro vaza para o resto da página (evita bagunçar outras variáveis).
(function () {

    // Cada objeto representa um dia de ponto de alguém.
    // O 'id' é como o CPF daquela linha específica para não editarmos o dia errado.
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

    // Variáveis de controle de estado (mudam com o tempo, por isso 'let'):
    let idEditando = null; // Guarda na memória qual registro o usuário clicou para editar
    let listaAtual = [];   // Guarda exatamente o que está aparecendo na tela após filtrar

    // CAPTURANDO OS ELEMENTOS DO HTML 
    // O JavaScript precisa "segurar" as tags HTML pelo ID para poder ler ou mudar coisas nelas
    const form = document.getElementById('filterForm');
    const tableBody = document.getElementById('tableBody');
    const tfootTotal = document.getElementById('tfootTotal');
    const emptyState = document.getElementById('emptyState');
    const selectColaborador = document.getElementById('colaborador');

    // Elementos da caixinha (modal/dialog) que abre quando clicamos em editar
    const modalEditar = document.getElementById('modalEditar');
    const formEditar = document.getElementById('formEditar');
    const editEntrada = document.getElementById('editEntrada');
    const editSaidaAlmoco = document.getElementById('editSaidaAlmoco');
    const editRetornoAlmoco = document.getElementById('editRetornoAlmoco');
    const editSaida = document.getElementById('editSaida');
    const btnCancelar = document.getElementById('btnCancelar');

    // FUNÇÕES AUXILIARES DE CÁLCULO E FORMATAÇÃO 

    // Fazer contas com texto como "08:30" é horrível.
    // O truque: converter tudo para minutos inteiros (ex: 8 * 60 + 30 = 510 min).
    function paraMinutos(hhmm) {
        const [h, m] = hhmm.split(':').map(Number); // quebra no ":" e converte pra número
        return h * 60 + m;
    }

    // O caminho inverso: pega minutos (510) e devolve texto bonito ("08:30")
    function paraHHMM(minutosTotais) {
        const sinal = minutosTotais < 0 ? '-' : '';
        const abs = Math.abs(minutosTotais); // ignora o sinal negativo pra calcular as horas
        const h = Math.floor(abs / 60);      // quantas horas inteiras cabem
        const m = abs % 60;                  // o que sobra da divisão são os minutos
        // padStart(2, '0') garante que o número 8 fique "08"
        return `${sinal}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    // Calcula o turno da manhã + turno da tarde para um dia
    function horasTrabalhadasMin(r) {
        const manha = paraMinutos(r.saidaAlmoco) - paraMinutos(r.entrada);
        const tarde = paraMinutos(r.saida) - paraMinutos(r.retornoAlmoco);
        return manha + tarde;
    }

    // Transforma a data do padrão americano do input (AAAA-MM-DD) para o brasileiro (DD/MM/AAAA)
    function formatarData(iso) {
        const [ano, mes, dia] = iso.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    // CARREGAR OS NOMES NO <select> 
    function preencherColaboradores() {
        // Set é mágico: remove automaticamente qualquer valor duplicado.
        // O sort() coloca os nomes em ordem A-Z.
        const nomes = [...new Set(registros.map(r => r.colaborador))].sort();

        // Limpa o select e deixa a primeira opção como "Todos"
        selectColaborador.innerHTML = '<option value="">Todos</option>';

        // Cria uma tag <option> para cada nome e joga dentro do <select>
        nomes.forEach(nome => {
            const option = document.createElement('option');
            option.value = nome;
            option.textContent = nome;
            selectColaborador.appendChild(option);
        });
    }

    // DESENHAR A TABELA NO NAVEGADOR 
    function render(lista) {
        listaAtual = lista; // salva a lista visível para podermos exportar depois
        tableBody.innerHTML = ''; // limpa a tabela antes de desenhar tudo de novo

        // Se o filtro não achar nada, mostra o aviso amigável e zera as horas
        if (lista.length === 0) {
            emptyState.style.display = 'block';
            tfootTotal.textContent = '00:00';
            return;
        }

        emptyState.style.display = 'none';

        let totalMin = 0; // acumulador para somar todas as horas

        lista
            .slice() // faz uma cópia rasa para não reordenar o array original por acidente
            .sort((a, b) => (a.data < b.data ? -1 : 1)) // ordena do dia mais antigo ao mais novo
            .forEach(r => {
                const minutos = horasTrabalhadasMin(r);
                totalMin += minutos;

                const tr = document.createElement('tr');

                // Monta a linha com os dados do registro.
                // Repare no data-id="${r.id}": colocamos uma "etiqueta" no ícone do lápis
                // para sabermos exatamente qual linha foi clicada.
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

        // Atualiza o rodapé com a soma total formatada em HH:MM
        tfootTotal.textContent = paraHHMM(totalMin);
    }

    // LÓGICA DO FILTRO 
    function aplicarFiltros() {
        const colaborador = selectColaborador.value;
        const dataInicio = document.getElementById('dataInicio').value;
        const dataFim = document.getElementById('dataFim').value;

        // O filter passa por cada item: só passa quem atender todas as condições.
        // Se o campo do filtro estiver vazio, a condição sempre passa como verdadeira.
        const filtrados = registros.filter(r =>
            (colaborador === '' || r.colaborador === colaborador) &&
            (dataInicio === '' || r.data >= dataInicio) &&
            (dataFim === '' || r.data <= dataFim)
        );

        render(filtrados); // redesenha a tabela só com os que passaram no teste
    }

    // DETECTANDO O CLIQUE NO LÁPIS (Event Delegation) 
    // Em vez de colocar 50 ouvintes de clique em cada botãozinho,
    // colocamos um só no corpo da tabela (tbody). Ele "escuta" tudo que sobe até ele.
    tableBody.addEventListener('click', e => {
        // Verifica se o que foi clicado (ou o pai dele) tem o atributo data-acao
        const botao = e.target.closest('[data-acao]');
        if (!botao) return; // se clicou no meio do texto ou no espaço em branco, não faz nada

        const id = Number(botao.dataset.id);
        const acao = botao.dataset.acao;

        // Procura no array o objeto exato que tem esse ID
        const registro = registros.find(r => r.id === id);
        if (!registro) return;

        if (acao === 'editar') {
            idEditando = id; // memoriza quem estamos editando agora

            // Carrega os valores atuais daquele dia nos campos da caixinha (modal)
            editEntrada.value = registro.entrada;
            editSaidaAlmoco.value = registro.saidaAlmoco;
            editRetornoAlmoco.value = registro.retornoAlmoco;
            editSaida.value = registro.saida;

            // showModal() é um método nativo das tags <dialog> modernas do HTML
            modalEditar.showModal();
        }
    });

    // ===== SALVAR AS ALTERAÇÕES DO MODAL =====
    formEditar.addEventListener('submit', e => {
        e.preventDefault(); // impede que a página recarregue e perca os dados

        const registro = registros.find(r => r.id === idEditando);
        if (!registro) return;

        // Sobrescreve as propriedades do objeto com o que o usuário digitou
        registro.entrada = editEntrada.value;
        registro.saidaAlmoco = editSaidaAlmoco.value;
        registro.retornoAlmoco = editRetornoAlmoco.value;
        registro.saida = editSaida.value;

        modalEditar.close();  // fecha a caixinha
        aplicarFiltros();     // redesenha a tabela com os novos valores e recalcula o total
    });

    // ===== BOTÃO CANCELAR =====
    btnCancelar.addEventListener('click', () => {
        modalEditar.close(); // fecha sem alterar nada
    });

    // ===== QUANDO CLICAR NO BOTÃO DE FILTRAR =====
    form.addEventListener('submit', e => {
        e.preventDefault(); // evita o recarregamento da página ao dar submit
        aplicarFiltros();
    });

    // ===== EXPORTAR PARA PLANILHA EXCEL =====
    document.getElementById('btnExportar').addEventListener('click', () => {
        if (listaAtual.length === 0) {
            alert('Não há registros para exportar.');
            return;
        }

        const ordenada = listaAtual.slice().sort((a, b) => (a.data < b.data ? -1 : 1));

        let totalMin = 0;
        // Monta a estrutura da planilha como se fosse uma matriz (linhas e colunas):
        // A primeira linha são os cabeçalhos das colunas
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

        // Adiciona a última linha com o total geral
        linhas.push(['Total do período', '', '', '', '', '', paraHHMM(totalMin)]);

        // Usa a biblioteca SheetJS (objeto global XLSX) para gerar o arquivo
        const planilha = XLSX.utils.aoa_to_sheet(linhas);
        planilha['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 18 }]; // largura das colunas

        const livro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(livro, planilha, 'Espelho de Ponto');
        XLSX.writeFile(livro, `espelho-de-ponto-${new Date().toISOString().slice(0, 10)}.xlsx`);
    });

    // INICIALIZAÇÃO
    // Assim que a página abre, roda essas duas para a tela não começar vazia
    preencherColaboradores();
    aplicarFiltros();
})();