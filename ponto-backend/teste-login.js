async function testarLogin() {
    const resposta = await fetch("https://helpdesk.medsystems.com.br:3000/registroPontoEstag/login", {
        method: "POST",
        body: new URLSearchParams({
            username: "SUP",
            password: "2025@Med@Systems",
        }),
    });

    console.log("Código:", resposta.status);
    const dados = await resposta.json();
    console.log("Resposta:", dados);
}

testarLogin();
