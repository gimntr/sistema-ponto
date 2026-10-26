// Testa a rota /login e não a API do ERP direto
async function testarRota() {
    //Chama o nosso próprio servidor, que está rodando na porta 3000
    const resposta = await fetch("http:localhost:3000/login", {
       //a rota foi criada com app.post, então tem que ser POST 
        method: "POST", 
        // avisa ao servidor que o corpo do pedido está em formato JSON
        headers: { "Content-Type": "application/json" },
            //Os dados que a tela vai mandar no futuro 
            body: JSON.stringify({
                username:"SUP",
                password: "2025@Med@Systems",
            }),
        });

        //Mostra o código da resposta 
        console.log("Código:", resposta.status);

        //Converte a resposta em objeto e mostra na tela
        const dados = await resposta.json();
        console.log("Resposta", dados);
    }

    testarRota();
