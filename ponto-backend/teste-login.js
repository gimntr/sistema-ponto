// Cria uma função assíncrona (com "async") pra gente poder esperar as coisas da internet carregarem sem travar tudo
async function testarLogin() {

    // Aqui a gente manda uma requisição pra esse link da empresa (a API deles)
    // O "await" faz o código esperar a resposta chegar antes de continuar
    const resposta = await fetch("https://helpdesk.medsystems.com.br:3000/registroPontoEstag/login", {
        // Diz que a gente tá enviando dados (POST), não só puxando informação (GET)
        method: "POST",
        
        // Monta o "pacote" com os dados do formulário:
        // CUIDADO: Deixar usuário e senha expostos direto no código assim é bem perigoso!
        body: new URLSearchParams({
            username: "SUP", // Usuário de teste
            password: "2025@Med@Systems", // A senha secreta (que agora não é tão secreta assim kkk)
        }),
    });

    // Mostra no console o número do status:
    // Se der 200 deu tudo certo, se der 401 ou 403 a senha tá errada, se der 500 o servidor quebrou
    console.log("Código:", resposta.status);

    // Converte o texto que o servidor mandou de volta em um formato que o JavaScript entende (JSON)
    const dados = await resposta.json();

    // Mostra no console o que veio na resposta (token, mensagem de erro, etc.)
    console.log("Resposta:", dados);
}

// Chama a função pra rodar tudo isso que a gente acabou de criar
testarLogin();