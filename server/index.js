import express from 'express';
import logger from 'morgan';
import {Server} from 'socket.io';
import {createServer} from 'node:http';
import dotenv from 'dotenv';
//aqui crear el cliente de sqlite de turso 
const port = process.env.PORT ?? 3000;
const app = express();
const server= createServer(app);
const io = new Server(server,{
    connectionStateRecovery: {},
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });  
    socket.on('chat message', (msg) => {
        //console.log('message: ' + msg);
        //broadCast para emitir un mensaje a todos los clientes
        io.emit('chat message', msg);
    }); 
})

app.use(logger('dev'))

app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/cliente/index.html');
})

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})