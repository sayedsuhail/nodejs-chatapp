const users = []

const addUser = ({ id, username, room }) => {
    // clean the data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // validate the data
    if (!username || !room) {
        return {
            error: 'Username and room are required!'
        }
    }

    // check for existing users
    const existingUsers = users.find((user) => {
        return (user.room === room) && (user.username === username)
    })

    // Validate username
    if (existingUsers) {
        return {
            error: 'Username is in use!'
        }
    }

    // store user
    const user = { id, username, room }
    users.push(user)
    return { user }
}

const removeUser = (id) => {
    const index = users.findIndex(user => user.id === id)

    if (index !== -1) {
        // remove user by index (1st index start, 2nd number of index)
        return users.splice(index, 1)[0] // index[0] will return the user that removed
    }
}

const getUser = id => users.find(user => user.id === id)

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    return users.filter(user => user.room === room)
}

module.exports = {
    addUser, 
    removeUser,
    getUser,
    getUsersInRoom
}