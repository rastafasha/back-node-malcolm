const { io } = require('../index');
const express = require('express');
const socketIO = require('socket.io');


const app = express();


// var server = require('http').Server(app);
// const io = require('socket.io')(server);
var authenticate = false;


io.on('connection', function(socket) {

    socket.on('message', (msg) => {
        console.log('a user connected');
        console.log('message : ' + msg);
        socket.broadcast.emit('message', msg);
    });

    socket.on('disconnect', function() {
        console.log('User disconnected');
    });
    socket.on('save-carrito', function(data) {
        io.emit('new-carrito', data);
        console.log('carrito',data);
    });
    socket.on('save-carrito_dos', function(data) {
        io.emit('new-carrito_dos', data);
        console.log('carrito2',data);
    });
    socket.on('save-mensaje', function(data) {
        io.emit('new-mensaje', data);
    });
    socket.on('save-formmsm', function(data) {
        io.emit('new-formmsm', data);
    });
    socket.on('save-stock', function(data) {
        io.emit('new-stock', data);
    });
    socket.on('save-notification', function(data) {
        io.emit('new-notification', data);
    });
    socket.on('stock-update', function(data) {
        io.emit('new-notification', data);
    });
});

// Configurar comunicación periódica cada 30 segundos
setInterval(() => {
    io.emit('ping', {
        message: 'Conexión activa',
        timestamp: new Date()
    });
    console.log('Ping enviado a todos los clientes');
}, 30000);




// io.on('connection', (client) => {
//     console.log('Usuario conectado');

//     //mensaje de bienvenida
//     client.emit('enviarMensaje', {
//         usuario: 'Administrador',
//         mensaje: 'Bienvenido a chat app'
//     });

//     client.on('disconnect', () => {
//         console.log('Usuario desconectado');
//     });

//     // escuchar el cliente
//     client.on('enviarMensaje', (data, callback) => {

//         console.log(data);

//         client.broadcast.emit('enviarMensaje', data); //envia mensaje a todos los usuarios conectados

//         // if (mensaje.usuario) {
//         //     callback({
//         //         resp: 'Todo salio bien!'
//         //     });
//         // } else {
//         //     callback({
//         //         resp: 'todo salio mal!'
//         //     });
//         // }

//         // callback();

//     });


// });