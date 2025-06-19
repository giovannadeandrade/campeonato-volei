// Função para aplicar máscara de telefone
function aplicarMascaraTelefone(input) {
    // Remove tudo que não é número
    let valor = input.value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    if (valor.length > 11) {
        valor = valor.substring(0, 11);
    }
    
    // Remove classes anteriores
    input.classList.remove('validando', 'valido');
    
    // Aplica a máscara baseada no tamanho
    if (valor.length >= 10) {
        // Para telefones com 10 ou 11 dígitos: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
        if (valor.length === 11) {
            valor = valor.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
            input.classList.add('valido'); // Telefone completo
        } else if (valor.length === 10) {
            valor = valor.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
            input.classList.add('valido'); // Telefone fixo completo
        }
    } else if (valor.length >= 6) {
        // Formatação parcial
        valor = valor.replace(/^(\d{2})(\d+)/, '($1) $2');
        input.classList.add('validando'); // Ainda digitando
    } else if (valor.length >= 2) {
        // Só o DDD
        valor = valor.replace(/^(\d{2})/, '($1) ');
        input.classList.add('validando'); // Ainda digitando
    } else if (valor.length > 0) {
        input.classList.add('validando'); // Ainda digitando
    }
    
    // Atualiza o valor do input
    input.value = valor;
    
    // Adiciona feedback sonoro sutil para telefone completo
    if (valor.length === 15 || valor.length === 14) { // (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
        // Pequena animação de sucesso
        input.style.transform = 'scale(1.02)';
        setTimeout(() => {
            input.style.transform = 'scale(1)';
        }, 150);
    }
}

// Função para permitir apenas números e caracteres da máscara
function permitirApenasNumeros(event) {
    const tecla = event.key;
    const caracteresPermitidos = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'];
    
    // Permite teclas de controle
    if (caracteresPermitidos.includes(tecla)) {
        return true;
    }
    
    // Permite Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
    if (event.ctrlKey && ['a', 'c', 'v', 'x', 'z'].includes(tecla.toLowerCase())) {
        return true;
    }
    
    // Permite apenas números
    if (!/\d/.test(tecla)) {
        event.preventDefault();
        return false;
    }
    
    return true;
}

// Função para validar telefone completo
function validarTelefoneCompleto(telefone) {
    const apenasNumeros = telefone.replace(/\D/g, '');
    return apenasNumeros.length === 10 || apenasNumeros.length === 11;
}

// Inicializa as máscaras quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    const campoTelefone = document.getElementById('telefone');
    
    if (campoTelefone) {
        // Aplica máscara enquanto digita
        campoTelefone.addEventListener('input', function() {
            aplicarMascaraTelefone(this);
        });
        
        // Controla as teclas permitidas
        campoTelefone.addEventListener('keydown', permitirApenasNumeros);
        
        // Aplica máscara no campo se já houver valor (útil para edição)
        if (campoTelefone.value) {
            aplicarMascaraTelefone(campoTelefone);
        }
        
        // Reaplica a máscara ao sair do campo
        campoTelefone.addEventListener('blur', function() {
            aplicarMascaraTelefone(this);
            
            // Mostra aviso se telefone incompleto
            if (this.value && !validarTelefoneCompleto(this.value)) {
                this.classList.add('erro');
                const small = this.parentElement.querySelector('small');
                if (small) {
                    small.style.color = '#ff6b6b';
                    small.textContent = 'Telefone incompleto - mínimo 10 dígitos';
                }
            } else {
                this.classList.remove('erro');
                const small = this.parentElement.querySelector('small');
                if (small) {
                    small.style.color = '';
                    small.textContent = 'Formato: (00) 00000-0000';
                }
            }
        });
        
        // Remove aviso ao focar novamente
        campoTelefone.addEventListener('focus', function() {
            this.classList.remove('erro');
            const small = this.parentElement.querySelector('small');
            if (small) {
                small.style.color = '';
                small.textContent = 'Formato: (00) 00000-0000';
            }
        });
        
        // Permite colar números formatados ou não
        campoTelefone.addEventListener('paste', function(event) {
            // Pequeno delay para processar o conteúdo colado
            setTimeout(() => {
                aplicarMascaraTelefone(this);
            }, 10);
        });
        
        // Adiciona estilo suave para transições
        campoTelefone.style.transition = 'all 0.3s ease, transform 0.15s ease';
    }
}); 