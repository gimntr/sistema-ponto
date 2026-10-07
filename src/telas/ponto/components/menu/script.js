export function inicializarMenu(container) {
  const btnAbrir = container.querySelector("#btn-abrir-menu");
  const btnFechar = container.querySelector("#btn-fechar-menu");
  const menuLateral = container.querySelector("#menu-lateral");
  const header = container.querySelector("#app-bar");

  function abrirMenu() {
    menuLateral.classList.add("aberto");
    menuLateral.style.zIndex = "1000";
  }

  function fecharMenu() {
    menuLateral.classList.remove("aberto");
  }

  btnAbrir.addEventListener("click", abrirMenu);
  btnFechar.addEventListener("click", fecharMenu);
}
