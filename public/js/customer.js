// This file contain the JQuery functions for customer sides to connect to the server and the human operator sides with socket.io to perform several action

var socket = io('/customer');
const messageContainer = document.getElementById('messages')
var Username ='';

// Send the username and agent selected to server before start the conversation
$('#selected-agent').submit(function(e){
    document.getElementById("main-container").style.display="block";
    document.getElementById("main-selection").style.display="none";
    // var tag = document.getElementById("customer-tag").value
    var selected = document.getElementById("agent").value
    Username = $('#username-input').val();
    var data = {agent: selected, username: Username}
    console.log(selected)
    console.log(Username)
    console.log(data)
    if(selected ==='chatbot-show'){
        document.getElementById("customer-tag").innerHTML = "Martin";

    }
    else if(selected === 'chatbot-hidden'){
        document.getElementById("customer-tag").innerHTML = "Louis";
    }
    else if(selected === 'chatbot-guide'){
        document.getElementById("customer-tag").innerHTML = "David";
    }
    
    socket.emit('customer-details',data)
    e.preventDefault()
});

// This function will process and sent the user message to the server and human operator sides
$('#user-message').submit(function(e){
    var messageText = $('#m').val();
    if(messageText  != ''){
        console.log(messageText)
        addMessageToUI(true, messageText)
    
        socket.emit('customer message', messageText);
        $('#m').val('');
    }
    e.preventDefault();
});

// This function will show the user input message on customer GUI
function addMessageToUI(isOwnMessage, message){
    const element = `
      <li class="${isOwnMessage ? 'message-right' : 'message-left'}">
          <p class="message">
            ${message}
            <span>${moment(new Date()).format('lll')}</span>
          </p>
        </li>
        `
    messageContainer.innerHTML += element
    scrollToBottom()
} 

// Automatically scroll down when new message added
function scrollToBottom(){
    messageContainer.scrollTo(0, messageContainer.scrollHeight)
}


// When we receive a customer message, display it
socket.on('customer message', function(msg){
    addMessageToUI(false, msg)
});

// When we receive a system error, display it
socket.on('system error', function(error) {
    var errorText = error.type + ' - ' + error.message;
    console.log(errorText);
    $('#messages').append($('<li class="customer-error">').text(errorText));
});
