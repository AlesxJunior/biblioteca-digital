const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 8080;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS libros (
                id SERIAL PRIMARY KEY,
                titulo VARCHAR(255) NOT NULL,
                autor VARCHAR(255) NOT NULL,
                anio INTEGER,
                genero VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        const count = await pool.query('SELECT COUNT(*) FROM libros');
        if (parseInt(count.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO libros (titulo, autor, anio, genero) VALUES
                ('Cien años de soledad', 'Gabriel García Márquez', 1967, 'Realismo mágico'),
                ('Don Quijote de la Mancha', 'Miguel de Cervantes', 1605, 'Novela'),
                ('El principito', 'Antoine de Saint-Exupéry', 1943, 'Infantil')
            `);
        }
        console.log('Base de datos inicializada');
    } catch (err) {
        console.error('Error DB:', err);
    }
}

app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM libros');
        res.render('index', { totalLibros: result.rows[0].count });
    } catch (err) {
        res.render('index', { totalLibros: 0 });
    }
});

app.get('/libros', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM libros ORDER BY id');
        res.render('libros', { libros: result.rows });
    } catch (err) {
        res.render('libros', { libros: [] });
    }
});

app.get('/agregar', (req, res) => {
    res.render('agregar');
});

app.post('/agregar', async (req, res) => {
    try {
        const { titulo, autor, año, genero } = req.body;
        await pool.query(
            'INSERT INTO libros (titulo, autor, anio, genero) VALUES ($1, $2, $3, $4)',
            [titulo, autor, parseInt(año), genero]
        );
        res.redirect('/libros');
    } catch (err) {
        res.redirect('/libros');
    }
});

app.get('/libro/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM libros WHERE id = $1', [req.params.id]);
        if (result.rows.length > 0) {
            res.render('detalle', { libro: result.rows[0] });
        } else {
            res.status(404).send('Libro no encontrado');
        }
    } catch (err) {
        res.status(500).send('Error del servidor');
    }
});

app.get('/dashboard', async (req, res) => {
    try {
        const totalLibros = await pool.query('SELECT COUNT(*) FROM libros');
        const librosPorGenero = await pool.query(`
            SELECT genero, COUNT(*) as cantidad FROM libros GROUP BY genero ORDER BY cantidad DESC
        `);
        const librosPorDecada = await pool.query(`
            SELECT (anio / 10) * 10 as decada, COUNT(*) as cantidad FROM libros WHERE anio IS NOT NULL GROUP BY decada ORDER BY decada
        `);
        const autoresTop = await pool.query(`
            SELECT autor, COUNT(*) as cantidad FROM libros GROUP BY autor ORDER BY cantidad DESC LIMIT 5
        `);
        const libroAntiguo = await pool.query('SELECT * FROM libros ORDER BY anio ASC LIMIT 1');
        const libroReciente = await pool.query('SELECT * FROM libros ORDER BY anio DESC LIMIT 1');

        res.render('dashboard', {
            totalLibros: totalLibros.rows[0].count,
            librosPorGenero: librosPorGenero.rows,
            librosPorDecada: librosPorDecada.rows,
            autoresTop: autoresTop.rows,
            libroAntiguo: libroAntiguo.rows[0],
            libroReciente: libroReciente.rows[0]
        });
    } catch (err) {
        console.error('Error dashboard:', err);
        res.status(500).send('Error generando dashboard');
    }
});

initDB().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Servidor corriendo en puerto ${PORT}`);
    });
});
