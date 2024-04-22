import express from 'express';
import logger from 'morgan';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { createServer } from 'node:http';
import mysql from 'mysql';

dotenv.config();

console.log(process.env.DB_HOST);
console.log(process.env.DB_USER);
console.log(process.env.DB_PASSWORD);
console.log(process.env.DB_DATABASE);

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

connection.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conexion correcta');

    connection.query(`CREATE TABLE IF NOT EXISTS messages(
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        content TEXT,
        user TEXT
    )`, (err, result) => {
        if (err) {
            console.error('Error al crear la tabla:', err);
            return;
        }
        console.log('Tabla creada correctamente');
    });

});
const port = process.env.PORT ?? 3000;
const app = express();
const server = createServer(app);
const io = new Server(server, {
    connectionStateRecovery: {},
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
    socket.on('chat message', (msg) => {
        const username = socket.handshake.auth.username ?? 'anonymus';
        console.log({ username });
        connection.query('INSERT INTO messages (content, user) VALUES (?, ?)', [msg, username], (err, result) => {
            if (err) {
                console.error('Error al insertar en la base de datos:', err);
                return;
            }
            console.log('Mensaje insertado correctamente. ID:', result.insertId);

            io.emit('chat message', msg, result.insertId.toString(), username);
        });
    });
});

app.use(logger('dev'));

app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/cliente/index.html');
});

app.get('/messages', (req, res) => {
    connection.query('SELECT * FROM messages', (err, rows) => {
        if (err) {
            console.error('Error al obtener los mensajes:', err);
            res.status(500).send('Error al obtener los mensajes');
            return;
        }
        res.json(rows);
    });
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://192.168.90.5:${port}`);
});
