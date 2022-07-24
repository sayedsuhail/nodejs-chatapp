const socket = io()

// -> Elements 
// for message-form
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
// for send-location
const $sendLocationButton = document.querySelector('#send-location')
// for messages
const $messages = document.querySelector('#messages')

// -> Templetes
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplete = document.querySelector('#sidebar-template').innerHTML

// -> Options 
// ignoreQueryPrefix -> will away question mark from header data
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // new message element
    const $newMessage = $messages.lastElementChild

    // height of new message
    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // visible height
    const visibleHeight = $messages.offsetHeight

    // height of messages container
    const containerHeight = $messages.scrollHeight

    // how far have I scrolled ?
    const scrollOffset = $messages.scrollTop + visibleHeight + 1

    if (containerHeight - newMessageHeight <= scrollOffset) {
        // scroll to end of messages
        $messages.scrollTop = $messages.scrollHeight
    }

}

// the name must match the one you emitted eg message
socket.on('message', (message) => {
    console.log(message)

    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    // insert messages to messages-div
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)

    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })

    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

// update room data
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplete, {
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html
})

// send message to the server
$messageForm.addEventListener('submit', (e)=> {
    // don't refresh the page
    e.preventDefault()

    // disable button
    $messageFormButton.setAttribute('disabled', 'disabled')

    // const message = document.querySelector('input').value
    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        // enable button, clear field, focus on field
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
    

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

// send location to the server
$sendLocationButton.addEventListener('click', (e) => {
    // check if browser support geolocation api
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser!')
    }

    // disabled button
    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {

        const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }

        socket.emit('sendLocation', location, () => {
            // enable button 
            $sendLocationButton.removeAttribute('disabled')

            console.log('Location shared!')
        })

        // console.log('Lat: ' + position.coords.latitude)
        // console.log('Long: ' + position.coords.longitude)
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})