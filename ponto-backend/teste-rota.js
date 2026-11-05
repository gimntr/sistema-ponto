// Aqui a gente cria uma função que espera as coisas acontecerem (async)
// Em vez de chamar o sistema oficial direto, a gente vai testar no nosso próprio computador
async function testarRota() {

    // Faz uma chamada pro nosso servidor local (o localhost é o nosso próprio PC)
    // O await serve pro código não sair correndo antes do servidor responder
    const resposta = await fetch("http://localhost:3000/login", {
        
        // Tipo de envio: POST (porque estamos mandando dados pra lá, e não só olhando a página)
        method: "POST", 
        
        // O "recadinho" pro servidor saber que o que vai no corpo é um texto em formato JSON
        headers: { "Content-Type": "application/json" },
        
        // Pega o objeto com o usuário e a senha e transforma em texto puro (JSON) pra conseguir enviar
        // Obs: depois tem que tirar essa senha fixa daqui pra ninguém roubar!
        body: JSON.stringify({
            username: "SUP",
            password: "2025@Med@Systems",
        }),
    });

    // Pega o número que o servidor devolveu:
    // 200 = sucesso, 400/401 = errou algo ou senha errada, 500 = o servidor capotou
    console.log("Código:", resposta.status);

    // Converte o texto que o servidor respondeu de volta pra objeto JS pra gente poder ler fácil
    const dados = await resposta.json();
    
    // Imprime no console pra gente ver o que veio (token, mensagem, etc.)
    console.log("Resposta", dados);
}

// Bota a função pra rodar logo de uma vez!
testarRota();