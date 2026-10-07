const btnAbrir = document.getElementById("btn-abrir-menu");
const btnFechar = document.getElementById("btn-fechar-menu");
const menuLateral = document.getElementById("menu-lateral");
const header = document.getElementById("app-bar");

function abrirMenu() {
  menuLateral.classList.add("aberto");
  header.style.display = "none";
}

function fecharMenu() {
  menuLateral.classList.remove("aberto");
  header.style.display = "block";
}

btnAbrir.addEventListener("click", abrirMenu);
btnFechar.addEventListener("click", fecharMenu);
