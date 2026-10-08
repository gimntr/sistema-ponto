export function inicializarMenu(container) {
  const btnAbrir = container.querySelector("#btn-abrir-menu");
  const btnFechar = container.querySelector("#btn-fechar-menu");
  const menuLateral = container.querySelector("#menu-lateral");
  const overlay = container.querySelector("#menu-lateral");

  function abrirMenu() {
    menuLateral.classList.add("aberto");
    menuLateral.classList.add("box-shadow");
    menuLateral.style.zIndex = "15";
  }

  function fecharMenu() {
    console.log("fecharMenu");
    menuLateral.classList.remove("box-shadow");
    menuLateral.style.background = "transparent";
    menuLateral.classList.remove("aberto");
  }

  btnAbrir.addEventListener("click", abrirMenu);
  btnFechar.addEventListener("click", fecharMenu);
  overlay.addEventListener("click", fecharMenu);
}
