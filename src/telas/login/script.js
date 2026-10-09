// esse código só começa a rodar quando a página terminou de carregar
// se rodasse antes, não ia achar os campos e ia dar erro
document.addEventListener('DOMContentLoaded', () => {

  // PEGAR AS COISAS DA PÁGINA
  const form = document.getElementById('loginForm');         // o formulário todo
  const inputUsuario = document.getElementById('usuario');   // a caixa do usuário
  const inputSenha = document.getElementById('senha');       // a caixa da senha
  const btnToggle = document.getElementById('togglePass');   // o botão do olho
  const eyeIcon = document.getElementById('eyeIcon');        // o desenho do olho (SVG)

  // procura dentro do formulário o botão de enviar (o "Entrar")
  const btnSubmit = form.querySelector('button[type="submit"]');

  // OS DOIS DESENHOS DO OLHO
  // olho aberto (quando a senha está escondida)
  const EYE_OPEN = `
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>`;

  // olho riscado (quando a senha está aparecendo)
  const EYE_CLOSED = `
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>`;

  // FUNÇÕES AJUDANTES (mostrar e limpar erro)
  // pega um input e devolve a div.field que está em volta dele
  const getField = (input) => input.closest('.field');

  // mostra um erro no campo
  // exemplo: setError(inputUsuario, 'Informe seu usuário.')
  function setError(input, mensagem) {
    const field = getField(input);

    field.classList.remove('valid');   // tira o verde, se tiver
    field.classList.add('error');      // põe a borda vermelha (o CSS cuida disso)

    // escreve a mensagem no textinho que fica embaixo do campo
    field.querySelector('.hint').textContent = mensagem;

    // avisa o leitor de tela que esse campo está com problema
    input.setAttribute('aria-invalid', 'true');
  }

  // tira o erro (ou o verde) do campo, deixa ele limpinho
  function clearState(input) {
    const field = getField(input);

    field.classList.remove('error', 'valid');   // tira as duas classes
    field.querySelector('.hint').textContent = '';   // apaga a mensagem
    input.removeAttribute('aria-invalid');   // tira o aviso do leitor de tela
  }

  // BOTÃO DO OLHO (mostrar/esconder a senha)
  btnToggle.addEventListener('click', () => {

    // vê se a senha tá escondida agora (true ou false)
    const oculta = inputSenha.type === 'password';

    // troca entre "text" (aparece) e "password" (escondida)
    inputSenha.type = oculta ? 'text' : 'password';

    // troca o desenho do olho
    eyeIcon.innerHTML = oculta ? EYE_CLOSED : EYE_OPEN;

    // atualiza a descrição do botão pro leitor de tela
    btnToggle.setAttribute('aria-label', oculta ? 'Ocultar senha' : 'Mostrar senha');

    // devolve o cursor pra caixa da senha
    inputSenha.focus();
  });

  // AVISO DE "CAPS LOCK LIGADO"
  // crio uma div nova só pra esse aviso
  const capsNote = document.createElement('div');
  capsNote.className = 'caps-note';                 // classe pro CSS estilizar
  capsNote.textContent = 'Caps Lock ativado';       // o texto do aviso
  capsNote.setAttribute('role', 'status');          // leitor de tela entende que é um aviso

  // coloco o aviso logo DEPOIS do bloco da senha
  getField(inputSenha).after(capsNote);

  // função que descobre se o Caps Lock tá ligado
  const verificarCapsLock = (e) => {
    // se o navegador não sabe fazer isso, nem tenta
    if (typeof e.getModifierState !== 'function') return;

    // se o Caps Lock tá ligado mostra o aviso, se não, esconde
    capsNote.classList.toggle('show', e.getModifierState('CapsLock'));
  };

  // confere toda vez que aperta ou solta uma tecla na senha
  inputSenha.addEventListener('keydown', verificarCapsLock);
  inputSenha.addEventListener('keyup', verificarCapsLock);

  // quando sai do campo da senha, esconde o aviso
  inputSenha.addEventListener('blur', () => capsNote.classList.remove('show'));

  // TIRAR O ERRO QUANDO A PESSOA VOLTA A DIGITAR
  // faço isso pros dois campos de uma vez com o forEach
  [inputUsuario, inputSenha].forEach((input) =>
    // quando digitar qualquer coisa, limpa o erro daquele campo
    input.addEventListener('input', () => clearState(input))
  );

  // VALIDAÇÃO (ver se preencheu tudo)
  // devolve true se tá tudo certo e false se tem campo vazio
  function validar() {
    // guarda o primeiro campo com problema (começa sem nenhum)
    let primeiroInvalido = null;

    // se o usuário tá vazio (o trim tira os espaços das pontas)
    if (inputUsuario.value.trim() === '') {
      setError(inputUsuario, 'Informe seu usuário.');   // mostra o erro
      primeiroInvalido = inputUsuario;                  // guarda ele
    }

    // se a senha tá vazia
    if (inputSenha.value === '') {
      setError(inputSenha, 'Digite sua senha.');   // mostra o erro
      // só guarda a senha se o usuário não tava com problema antes
      primeiroInvalido = primeiroInvalido || inputSenha;
    }

    // coloca o cursor no primeiro campo com problema
    // o "?." só faz isso se existir algum, senão ignora
    primeiroInvalido?.focus();

    // se não tem nenhum inválido devolve true, senão false
    return !primeiroInvalido;
  }

  // MANDAR OS DADOS PRO SERVIDOR
  // TODO: trocar '/api/login' pelo endereço de verdade do back-end
  // e ajustar os campos conforme o que ele espera receber
  async function autenticar(usuario, senha) {

  const myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

  const urlencoded = new URLSearchParams();
  urlencoded.append("username", usuario);
  urlencoded.append("senha", senha);

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: urlencoded,
    redirect: "follow"
  };

  const resposta = await fetch("https://helpdesk.medsystems.com.br:3000/login", requestOptions)
  .then(response => response.json())

    // se o servidor respondeu com erro (401, 500, etc), joga um erro
    if (!resposta.JSONID){
      throw new Error('Usuário ou senha inválidos.')
    };

    localStorage.setItem('usuario', usuario);
    localStorage.setItem('JSONID', resposta.JSONID);
    localStorage.setItem('token', resposta.bearer);

    window.location.href = '/src/telas/ponto/registro-ponto/index.html';

    // se deu certo, devolve a resposta já transformada em objeto
    return resposta;
  }

  // LIGAR O FORMULÁRIO (o que acontece ao clicar em "Entrar")
  form.addEventListener('submit', async (e) => {

    // impede a página de recarregar sozinha
    e.preventDefault();

    // se tem campo vazio, mostra os erros e para por aqui
    if (!validar()) return;

    // desativa o botão pra pessoa não clicar várias vezes
    btnSubmit.disabled = true;

    try {
      // tenta fazer o login com o que foi digitado
      await autenticar(inputUsuario.value.trim(), inputSenha.value);

      // deu certo: aqui manda pra próxima página (tira o // e ajusta o endereço)
      // window.location.href = '/painel';

    } catch (erro) {
      // deu errado: mostra a mensagem embaixo do campo da senha
      setError(inputSenha, erro.message);

    } finally {
      // dando certo ou errado, liga o botão de novo
      btnSubmit.disabled = false;
    }
  });

}); 