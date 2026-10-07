export async function carregarMenu() {
  // carrega o CSS do menu
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = '/telas/ponto/components/menu/style.css';
  document.head.appendChild(css);

  // carrega o HTML do menu
  const container = document.getElementById('menu-container');
  const resposta = await fetch('/telas/ponto/components/menu/components.html');
  container.innerHTML = await resposta.text();
}
// Pega uma REFERÊNCIA (um "controle remoto") pro botão de abrir o menu,
        // procurando na página o elemento que tem id="btn-abrir-menu"
        const btnAbrir = document.getElementById('btn-abrir-menu');

        // Pega a referência do PRÓPRIO menu lateral (a <nav>),
        // porque vamos precisar adicionar/remover uma classe CSS nele
        const menu = document.getElementById('menu-lateral');

        // Pega a referência do conteúdo principal da página (o <main>),
        // porque quando o menu abre, o conteúdo precisa "empurrar" pra direita
        const conteudo = document.getElementById('conteudo-principal');

        let aberto = false

        // Diz: "fique escutando cliques no btnAbrir. Quando clicar, roda essa função"
        btnAbrir.addEventListener('click', () => {
            // Adiciona a classe CSS "aberto" na tag do menu.
            // É essa classe que ativa a regra do CSS:
            //   #menu-lateral.aberto { transform: translateX(0); }
            if (!aberto) {
                menu.classList.add('aberto');

                // Adiciona a classe "deslocado" no conteúdo principal,
                // empurrando o texto pra direita, abrindo espaço pro menu
                conteudo.classList.add('deslocado');

                aberto = true
            }

            else {
                menu.classList.remove('aberto');

                // Remove a classe "deslocado": o conteúdo volta pra posição original
                conteudo.classList.remove('deslocado');

                aberto = false
            }
        });
