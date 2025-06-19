const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
    secret: 'segredo',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1800000 }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.redirect('/login');
});

let equipes = [];
let jogadores = [];

// Funções de validação
function validarTelefone(telefone) {
    const regex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    return regex.test(telefone);
}

function calcularIdade(dataNascimento) {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    return idade;
}

function validarNome(nome) {
    return nome && nome.trim().length >= 2 && nome.trim().length <= 50;
}

function validarEquipe(nome, tecnico, telefone) {
    const erros = [];
    
    // Validar nome da equipe
    if (!validarNome(nome)) {
        erros.push('Nome da equipe deve ter entre 2 e 50 caracteres');
    }
    
    // Verificar se equipe já existe
    if (equipes.some(eq => eq.nome.toLowerCase() === nome.toLowerCase())) {
        erros.push('Já existe uma equipe com este nome');
    }
    
    // Validar nome do técnico
    if (!validarNome(tecnico)) {
        erros.push('Nome do técnico deve ter entre 2 e 50 caracteres');
    }
    
    // Validar telefone
    if (!validarTelefone(telefone)) {
        erros.push('Telefone deve estar no formato (00) 00000-0000');
    }
    
    return erros;
}

function validarJogador(nome, numero, nascimento, altura, genero, posicao, equipe) {
    const erros = [];
    
    // Validar nome do jogador
    if (!validarNome(nome)) {
        erros.push('Nome do jogador deve ter entre 2 e 50 caracteres');
    }
    
    // Verificar se jogador já existe na equipe
    if (jogadores.some(j => j.nome.toLowerCase() === nome.toLowerCase() && j.equipe === equipe)) {
        erros.push('Já existe um jogador com este nome nesta equipe');
    }
    
    // Validar número da camisa
    const numeroInt = parseInt(numero);
    if (!numeroInt || numeroInt < 1 || numeroInt > 99) {
        erros.push('Número da camisa deve estar entre 1 e 99');
    }
    
    // Verificar se número já existe na equipe
    if (jogadores.some(j => j.numero === numero && j.equipe === equipe)) {
        erros.push('Este número de camisa já está sendo usado por outro jogador da equipe');
    }
    
    // Validar idade
    const idade = calcularIdade(nascimento);
    if (idade < 16) {
        erros.push('Jogador deve ter pelo menos 16 anos de idade');
    }
    if (idade > 50) {
        erros.push('Idade máxima permitida é 50 anos');
    }
    
    // Validar altura
    const alturaInt = parseInt(altura);
    if (!alturaInt || alturaInt < 150 || alturaInt > 220) {
        erros.push('Altura deve estar entre 150 e 220 centímetros');
    }
    
    // Validar gênero
    if (!['Masculino', 'Feminino'].includes(genero)) {
        erros.push('Gênero deve ser Masculino ou Feminino');
    }
    
    // Validar posição
    const posicoesValidas = ['Levantador', 'Oposto', 'Central', 'Ponteiro', 'Líbero'];
    if (!posicoesValidas.includes(posicao)) {
        erros.push('Posição deve ser uma das opções válidas');
    }
    
    // Verificar se equipe existe
    if (!equipes.some(eq => eq.nome === equipe)) {
        erros.push('Equipe selecionada não existe');
    }
    
    // Validar quantidade de jogadores por equipe (máximo 12)
    const jogadoresDaEquipe = jogadores.filter(j => j.equipe === equipe);
    if (jogadoresDaEquipe.length >= 12) {
        erros.push('Equipe já possui o número máximo de jogadores (12)');
    }
    
    // Validar quantidade de líberos por equipe (máximo 2)
    if (posicao === 'Líbero') {
        const liberosDaEquipe = jogadores.filter(j => j.equipe === equipe && j.posicao === 'Líbero');
        if (liberosDaEquipe.length >= 2) {
            erros.push('Equipe já possui o número máximo de líberos (2)');
        }
    }
    
    return erros;
}

function autenticar(req, res, next) {
    if (req.session.usuario) {
        next();
    } else {
        res.redirect('/login');
    }
}

app.get('/login', (req, res) => {
    res.render('login', { erro: null });
});

app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;
    if (usuario === 'admin' && senha === '1234') {
        req.session.usuario = usuario;
        const dataHora = new Date().toLocaleString();
        res.cookie('ultimoAcesso', dataHora, { maxAge: 30 * 24 * 60 * 60 * 1000 });
        res.redirect('/menu');
    } else {
        res.render('login', { erro: 'Usuário ou senha inválidos' });
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('ultimoAcesso');
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

app.get('/menu', autenticar, (req, res) => {
    const ultimoAcesso = req.cookies.ultimoAcesso;
    res.render('menu', { ultimoAcesso });
});

app.get('/cadastro-equipe', autenticar, (req, res) => {
    res.render('cadastrodaequipe', { erros: null, dados: null });
});

app.post('/salvar-equipe', autenticar, (req, res) => {
    const { nome, tecnico, telefone } = req.body;
    
    // Validar campos obrigatórios
    if (!nome || !tecnico || !telefone) {
        return res.render('cadastrodaequipe', { 
            erros: ['Todos os campos são obrigatórios'], 
            dados: req.body 
        });
    }
    
    // Validar dados
    const erros = validarEquipe(nome.trim(), tecnico.trim(), telefone.trim());
    
    if (erros.length > 0) {
        return res.render('cadastrodaequipe', { erros, dados: req.body });
    }
    
    // Salvar equipe
    equipes.push({ 
        nome: nome.trim(), 
        tecnico: tecnico.trim(), 
        telefone: telefone.trim() 
    });
    
    res.redirect('/listar-equipes');
});

app.get('/listar-equipes', autenticar, (req, res) => {
    res.render('listaequipes', { equipes });
});

app.get('/cadastro-jogador', autenticar, (req, res) => {
    res.render('cadastrojogador', { equipes, erros: null, dados: null });
});

app.post('/salvar-jogador', autenticar, (req, res) => {
    const { nome, numero, nascimento, altura, genero, posicao, equipe } = req.body;
    
    // Validar campos obrigatórios
    if (!nome || !numero || !nascimento || !altura || !genero || !posicao || !equipe) {
        return res.render('cadastrojogador', { 
            equipes, 
            erros: ['Todos os campos são obrigatórios'], 
            dados: req.body 
        });
    }
    
    // Validar dados
    const erros = validarJogador(
        nome.trim(), 
        numero, 
        nascimento, 
        altura, 
        genero, 
        posicao, 
        equipe
    );
    
    if (erros.length > 0) {
        return res.render('cadastrojogador', { equipes, erros, dados: req.body });
    }
    
    // Salvar jogador
    jogadores.push({ 
        nome: nome.trim(), 
        numero: parseInt(numero), 
        nascimento, 
        altura: parseInt(altura), 
        genero, 
        posicao, 
        equipe 
    });
    
    res.redirect('/listar-jogadores');
});

app.get('/listar-jogadores', autenticar, (req, res) => {
    res.render('listajogadores', { jogadores, equipes });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo deu errado!');
});

module.exports = app;
