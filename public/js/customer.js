var socket = io('/customer');
const messageContainer = document.getElementById('messages')

$('#selected-agent').submit(function(e){
    document.getElementById("main-container").style.display="block";
    var selected = document.getElementById("agent").value
    var username = $('#username-input').val();
    var data = {agent: selected, username: username}
    console.log(selected)
    console.log(username)
    console.log(data)
    socket.emit('customer-details',data)
    e.preventDefault()
});

// function showForm(){
//     document.getElementById("main-container").style.display="block";
//     var selected = document.getElementById("agent").value
//     console.log(selected)
// }

// When the form is submitted, send a customer message to the server
$('#user-message').submit(function(e){
    var messageText = $('#m').val();
    console.log(messageText)
    addMessageToUI(true, messageText)

    // $('#messages').append($('<li class="customer-message">').text(messageText));
    socket.emit('customer message', messageText);
    $('#m').val('');
    e.preventDefault();
    // return false;
});

function addMessageToUI(isOwnMessage, message){
    const element = `
      <li class="${isOwnMessage ? 'message-right' : 'message-left'}">
          <p class="message">
            ${message}
          </p>
        </li>
        `
    messageContainer.innerHTML += element
    scrollToBottom()
} 

function scrollToBottom(){
    messageContainer.scrollTo(0, messageContainer.scrollHeight)
}

function clearFeedback(){
    document
}

// When we receive a customer message, display it
socket.on('customer message', function(msg){
    addMessageToUI(false, msg)
    // $('#messages').append($('<li>').text(msg));
});

// When we receive a system error, display it
socket.on('system error', function(error) {
    var errorText = error.type + ' - ' + error.message;
    console.log(errorText);
    $('#messages').append($('<li class="customer-error">').text(errorText));
});
