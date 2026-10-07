const templateUrl = new URL("./index.html", import.meta.url);
const styleUrl = new URL("./style.css", import.meta.url);
const scriptUrl = new URL("./script.js", import.meta.url);

class Banner extends HTMLElement {
  async connectedCallback() {
    try {
      if (!document.querySelector(`link[href="${styleUrl.href}"]`)) {
        const style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = styleUrl.href;
        document.head.appendChild(style);
      }

      const resposta = await fetch(templateUrl);
      this.innerHTML = await resposta.text();

      const { inicializarMenu } = await import(scriptUrl.href);
      inicializarMenu(this);
    } catch (erro) {
      console.error("Erro ao carregar o componente:", erro);
      this.innerHTML = `<p style="color: red;">Erro ao carregar componente.</p>`;
    }
  }
}

customElements.define("my-menu", Banner);
