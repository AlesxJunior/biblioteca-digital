const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Base de datos temporal (en memoria)
let libros = [
    { id: 1, titulo: 'Cien años de soledad', autor: 'Gabriel García Márquez', año: 1967, genero: 'Realismo mágico' },
    { id: 2, titulo: 'Don Quijote de la Mancha', autor: 'Miguel de Cervantes', año: 1605, genero: 'Novela' },
    { id: 3, titulo: 'El principito', autor: 'Antoine de Saint-Exupéry', año: 1943, genero: 'Infantil' }
];

// Rutas
app.get('/', (req, res) => {
    res.render('index', { totalLibros: libros.length });
});

app.get('/libros', (req, res) => {
    res.render('libros', { libros: libros });
});

app.get('/agregar', (req, res) => {
    res.render('agregar');
});

app.post('/agregar', (req, res) => {
    const nuevoLibro = {
        id: libros.length + 1,
        titulo: req.body.titulo,
        autor: req.body.autor,
        año: parseInt(req.body.año),
        genero: req.body.genero
    };
    libros.push(nuevoLibro);
    res.redirect('/libros');
});

app.get('/libro/:id', (req, res) => {
    const libro = libros.find(l => l.id === parseInt(req.params.id));
    if (libro) {
        res.render('detalle', { libro: libro });
    } else {
        res.status(404).send('Libro no encontrado');
    }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
