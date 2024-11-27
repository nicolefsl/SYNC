function meuEscopo ()    {

    document.querySelector('#cadastrar').addEventListener('click', function(e){

        e.preventDefault();
        const input_email = document.querySelector('#E-mail');
        const input_senha = document.querySelector('#Senha');
        const input_check_senha = document.querySelector('#confirmaSenha');
        
        let email = input_email.value;
        let senha = input_senha.value;
        let checkSenha = input_check_senha.value;

        if(senha === checkSenha && senha !== '' && email !== ''){            
            localStorage.setItem('email', email);
            localStorage.setItem('senha', senha);
            window.location.href = './login.html';
        } else{
            input_email.value = '';
            input_senha.value = '';
            input_check_senha.value = '';
            alert('Dados inválidos.');
        }
    });
}

meuEscopo()