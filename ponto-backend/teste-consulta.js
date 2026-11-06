// Cria uma função assíncrona pra testar a consulta na API local sem travar o navegador/Node
async function testarConsulta() {

    // Faz a requisição pro backend que tá rodando na minha própria máquina (localhost) na porta 3000
    // Passa os parâmetros na URL: o usuário e o período de datas de outubro
    const resposta = await fetch("http://localhost:3000/consulta?userCode=1495&dataInicio=01/10/2026&dataFim=28/10/2026", {
        headers: { 
            // Cabeçalho de autorização: tem que colar o token/crachá de verdade aqui senão vai dar erro 401
            authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJnaW92YW5uYS5tb250ZWlybyIsImlhdCI6MTc5Mzk3NTMxMSwiZXhwIjoxNzk0MDYxNzExfQ.cBrf-VqHrp569-w3rdOTcbArwcg0c2LfcoybdEk4OUg" 
        }
    });

    // Espera a resposta chegar e converte o que veio em texto pra formato JSON (objeto/array legível)
    const dados = await resposta.json();

    // Joga o resultado no console pra gente ver se deu certo ou se veio vazio/com erro
    console.log(dados);
}

// Chama a função logo em seguida pro script rodar de uma vez
testarConsulta();