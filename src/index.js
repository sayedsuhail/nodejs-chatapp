// {بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم}
const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')
const { getuid } = require('process')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

// server  (emit) -> client (receive) - countUpdated
// client (emit) -> server (receive) - increment

// run some code when a given client connected ('connection' is a builtin ftn)
io.on('connection', (socket) => {
    console.log('New WebSocket connection!')

    // // it will send to current user/socket only
    // socket.emit('message', generateMessage('Welcome!'))

    // // it will send to everyone except the current user 
    // socket.broadcast.emit('message', generateMessage('A new user has joined!'))

    // listener for join
    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options }) // add user to an array

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        // it will send to current user/socket only
        socket.emit('message', generateMessage('Admin', 'Welcome!'))

        // it will send to everyone in specific room except the current user 
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))

        // room name and list of users in room
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    // it will send to all users
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)

        const filter = new Filter()

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }

        io.to(user.room).emit('message', generateMessage(user.username, message))

        // call the acknowledgement after share message with everyone 
        callback()
    })

    // it will send location to all users
    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${location.latitude},${location.longitude}`))

        callback()
    })

    // builtin ftn that show msg when user disconnected
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))

            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

// 2nd arg is optional 
server.listen(port, () => {
    console.log(`Server is up on port ${port}!`) 
})