function meuEscopo()    {
    document.querySelector('#entrar').addEventListener('click', function(e){
        e.preventDefault();

        const input_email = document.querySelector('#meuEmail');
        const input_senha = document.querySelector('#minhaSenha');

        let tentativa_email = input_email.value; 
        let tentativa_senha = input_senha.value;
        let email_cadastrado = localStorage.getItem('email');
        let senha_cadastrada = localStorage.getItem('senha');
        
        if(tentativa_email === null && tentativa_senha === null){
            alert('Usuário não encontrado.');
            
        } else {
            if (tentativa_email === email_cadastrado &&
                tentativa_senha === senha_cadastrada) {
                window.location.href = './inicio&barra.html';
            } else {
                alert('Usuario não cadastrado.')
              }
         }
    });
}

meuEscopo()