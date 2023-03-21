var socket = io('/customer');
const messageContainer = document.getElementById('messages')
var Username ='';

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

// function showForm(){
//     document.getElementById("main-container").style.display="block";
//     var selected = document.getElementById("agent").value
//     console.log(selected)
// }

// When the form is submitted, send a customer message to the server
$('#user-message').submit(function(e){
    var messageText = $('#m').val();
    if(messageText  != ''){
        console.log(messageText)
        addMessageToUI(true, messageText)
    
        // $('#messages').append($('<li class="customer-message">').text(messageText));
        socket.emit('customer message', messageText);
        $('#m').val('');
    }
    // $.post("/sending",
    // {
    //     messages: messageText,
    //     username: Username
    // },
    // function(data, status){
    //     alert("Data: " + data + "\nStatus: " + status);
    // });
    e.preventDefault();
    // return false;
});

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
