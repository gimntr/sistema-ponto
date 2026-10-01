// Este código só começa a rodar depois que a página terminou de carregar.
// Se rodasse antes, ele não encontraria os campos e daria erro.
document.addEventListener('DOMContentLoaded', () => {

  // =====================================================
  // PASSO 1: PEGAR OS ELEMENTOS DA PÁGINA
  // =====================================================
  const form = document.getElementById('loginForm');         // o formulário inteiro
  const inputUsuario = document.getElementById('usuario');   // caixa onde digita o usuário
  const inputSenha = document.getElementById('senha');       // caixa onde digita a senha
  const btnToggle = document.getElementById('togglePass');   // botão do olho
  const eyeIcon = document.getElementById('eyeIcon');        // desenho do olho (SVG)

  // Procura, dentro do formulário, o botão de enviar (o "Entrar")
  const btnSubmit = form.querySelector('button[type="submit"]');


  // =====================================================
  // PASSO 2: OS DOIS DESENHOS DO OLHO
  // =====================================================
  // Olho aberto (senha escondida)
  const EYE_OPEN = `
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>`;

  // Olho riscado (senha visível)
  const EYE_CLOSED = `
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>`;


  // =====================================================
  // PASSO 3: FUNÇÕES AJUDANTES (mostrar e limpar erros)
  // =====================================================

  // Recebe um input e devolve o "bloco" (div.field) onde ele está dentro.
  const getField = (input) => input.closest('.field');

  // Mostra um erro em um campo.
  // Exemplo: setError(inputUsuario, 'Informe seu usuário.')
  function setError(input, mensagem) {
    const field = getField(input);

    field.classList.remove('valid');   // tira o verde, se tiver
    field.classList.add('error');      // borda vermelha (definida no CSS)

    // Escreve a mensagem de erro na div.hint (textinho embaixo do campo)
    field.querySelector('.hint').textContent = mensagem;

    // Avisa leitores de tela que esse campo está com problema
    input.setAttribute('aria-invalid', 'true');
  }

  // Tira qualquer erro ou verde de um campo.
  function clearState(input) {
    const field = getField(input);

    field.classList.remove('error', 'valid');
    field.querySelector('.hint').textContent = '';
    input.removeAttribute('aria-invalid');
  }


  // =====================================================
  // PASSO 4: BOTÃO DO OLHO (mostrar/ocultar senha)
  // =====================================================
  btnToggle.addEventListener('click', () => {

    // A senha está escondida agora?
    const oculta = inputSenha.type === 'password';

    // Alterna entre "text" (visível) e "password" (escondida)
    inputSenha.type = oculta ? 'text' : 'password';

    // Troca o desenho do olho
    eyeIcon.innerHTML = oculta ? EYE_CLOSED : EYE_OPEN;

    // Atualiza a descrição do botão para leitores de tela
    btnToggle.setAttribute('aria-label', oculta ? 'Ocultar senha' : 'Mostrar senha');

    // Devolve o cursor para a caixa da senha
    inputSenha.focus();
  });


  // =====================================================
  // PASSO 5: AVISO DE "CAPS LOCK ATIVADO"
  // =====================================================
  const capsNote = document.createElement('div');
  capsNote.className = 'caps-note';
  capsNote.textContent = 'Caps Lock ativado';
  capsNote.setAttribute('role', 'status');

  // Coloca o aviso logo DEPOIS do bloco da senha
  getField(inputSenha).after(capsNote);

  // Descobre se o Caps Lock está ligado
  const verificarCapsLock = (e) => {
    if (typeof e.getModifierState !== 'function') return;
    capsNote.classList.toggle('show', e.getModifierState('CapsLock'));
  };

  inputSenha.addEventListener('keydown', verificarCapsLock);
  inputSenha.addEventListener('keyup', verificarCapsLock);

  // Ao sair do campo da senha, esconde o aviso
  inputSenha.addEventListener('blur', () => capsNote.classList.remove('show'));


  // =====================================================
  // PASSO 6: APAGAR O ERRO QUANDO A PESSOA VOLTA A DIGITAR
  // =====================================================
  [inputUsuario, inputSenha].forEach((input) =>
    input.addEventListener('input', () => clearState(input))
  );


  // =====================================================
  // PASSO 7: VALIDAÇÃO (checar se está tudo preenchido)
  // =====================================================
  // Devolve true se está tudo certo, false se tem algum campo vazio.
  function validar() {
    let primeiroInvalido = null;

    if (inputUsuario.value.trim() === '') {
      setError(inputUsuario, 'Informe seu usuário.');
      primeiroInvalido = inputUsuario;
    }

    if (inputSenha.value === '') {
      setError(inputSenha, 'Digite sua senha.');
      primeiroInvalido = primeiroInvalido || inputSenha;
    }

    // Coloca o cursor no primeiro campo com problema
    primeiroInvalido?.focus();

    return !primeiroInvalido;
  }


  // =====================================================
  // PASSO 8: ENVIAR OS DADOS PARA O SERVIDOR
  // =====================================================
  // TODO: troque '/api/login' pelo endereço real do seu back-end
  // e ajuste os campos enviados conforme o que ele espera.
  async function autenticar(usuario, senha) {

    // "await" = espera o servidor responder antes de seguir
    const resposta = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha })
    });

    // Se o servidor respondeu com erro (401, 500 etc.), lança um erro
    if (!resposta.ok) throw new Error('Usuário ou senha inválidos.');

    // Se deu certo, devolve a resposta já convertida em objeto
    return resposta.json();
  }


  // =====================================================
  // PASSO 9: LIGAR O FORMULÁRIO (o que acontece ao clicar em "Entrar")
  // =====================================================
  form.addEventListener('submit', async (e) => {

    // Impede a página de recarregar sozinha
    e.preventDefault();

    // Se algum campo estiver vazio, mostra os erros e para aqui
    if (!validar()) return;

    // Desativa o botão para evitar cliques repetidos
    btnSubmit.disabled = true;

    try {
      await autenticar(inputUsuario.value.trim(), inputSenha.value);

      // Deu certo: redirecione para a página seguinte (descomente e ajuste)
      // window.location.href = '/painel';

    } catch (erro) {
      // Deu errado: mostra a mensagem embaixo do campo da senha
      setError(inputSenha, erro.message);

    } finally {
      // De qualquer jeito, reativa o botão
      btnSubmit.disabled = false;
    }
  });

}); // fim do DOMContentLoaded