// This file contain the JQuery functions for human operator sides to connect to the server and the customer sides with socket.io to perform several action

// This function is to retrieve old message after the page refresh in order to continue the conversation
function getExisitingId (){
  socket.emit('retrieve_existing_id', 'retrieve_existing_id')
  socket.emit('getMessage','getMessage')

}

  var socket = io('/operator');
  // UI elements for all the customers we currently aware of
  var connectedCustomers = {};
  // Pointer to the currently open tab
  var currentTab;
  

  // The format we use to communicate a message to a specific customer
  var messageObject = function(customerId, utterance) {
    return { customerId: customerId, utterance: utterance };
  };

  // When the form is submitted, send an operator message to the server and the customer
  $('form').submit(function(){

    // if the customer is disconnected, the human operator should not able to send the message in that chat anymore
    if(currentTab.disconnected) {
      return false;
    }
    var messageText = $('#m').val();
    if(messageText != ""){
      socket.emit('operator message', messageObject(currentTab.customerId, messageText));
      $('#m').val('');
      $(".chatbot-suggestion").remove();
      return false;
    }
    return false;
  });

  // Switch to a different tab of different users
  var setCurrentTab = function(target) {
    // console.log("change-tab")
      // Do nothing if this is already the current tab
      if(currentTab === target) return;
      // Set the current tab
      currentTab = target;
      // Remove any other selected tab
      $('li.chat-tab').removeClass('selected');
      // Mark this tab as selected
      target.tab.addClass('selected');
      // Hide any other chat windows
      $('.chat-window').hide();
      // Show this chat window
      target.window.show();

      target.window.attr("style", "display: flex");
      target.window.addClass("chat-window")
  };

  // This will create new customer tab based on the customer id which reference from socket id
  var createNewCustomerTab = function(customer) {
    var newChatElements = {};
    newChatElements.customerId = customer.id;
    // A tab displaying the customer id
    newChatElements.tab = $('<li class="chat-tab">').html(customer.username + "<span>" + customer.agent + "</span>");
    // The chat log for this customer
    newChatElements.window = $('<ul class="chat-window">').hide();

    var clickHandler = function() {
      setCurrentTab(newChatElements);
    };
    newChatElements.tab.click(clickHandler);

    connectedCustomers[customer.id] = newChatElements;
    if(!currentTab) {
      console.log('Setting current tab');
      clickHandler();
    }

    $('.chatTabs').append(newChatElements.tab);
    $('.chatWindows').append(newChatElements.window);
  };

  // Notify the operator that a customer has requested them
  var notifyOperatorRequest = function(customerId) {
    if(!connectedCustomers[customerId]) {
      console.log('Received operator request from unknown customer id: ' + customerId);
      return;
    }
    setCurrentTab(connectedCustomers[customerId]);
    alert('Operator requested!');
  };

  // Notify the operator that a customer has disconnected
  var notifyCustomerDisconnected = function(customer) {
    let customerId = customer.id;
    if(!connectedCustomers[customerId]) {
      console.log('Received disconnect notification for unknown customer id: ' + customerId);
      return;
    }
    connectedCustomers[customerId].disconnected = true;
    $li = $('<li class="customer-message">').text('--- Customer disconnected ---')
    connectedCustomers[customerId]
      .window
      .append($li);
    scrollToBottom(connectedCustomers[customerId]
      .window
      .append($li))
    console.log("li:eq('"+customerId+"')")
  };

  // Notify the operator of a system error met
  var notifySystemError = function(error) {
    var errorText;
    // If we get this custom error type, the error was due to an operator mistake; display it
    // in a friendlier manner (without the word 'Error')
    if(error.type === 'CustomerModeError') {
      errorText = error.message;
    // Otherwise, print the error type and message
    } else {
      errorText = error.type + ' - ' + error.message;
    }
    if(!currentTab) return;
    const $li = $('<li class="operator-error">').text(errorText)
    currentTab.window.append($li);
    scrollToBottom(currentTab.window.append($li))
  };

  // Display messages sent by any operator on the human operator interface
  var receivedOperatorMessage = function(msg) {
    var customer = connectedCustomers[msg.customerId];
    if(!customer) {
      console.log('Received operator message to unknown customer id: ' + JSON.stringify(msg));
      return;
    }
    const $li = $('<li class="operator-message">').html(msg.utterance + "<span>" + moment(new Date()).format('lll') + "</span>");
    customer.window
      .append($li);
    
    scrollToBottom(customer.window.append($li));
  };

  // Display messages sent by customers on the human operator interface.
  var receivedCustomerMessage = function(msg) {
    if(!connectedCustomers[msg.customerId]) {
      console.log('Received message for unknown customer id: ' + JSON.stringify(msg));
      return;
    }

    var prefix = msg.isAgentResponse ? 'Agent: ' : 'Customer: ';
    // var test = msg.utterance.replace(/<br \/>/g,"\n");
    // console.log(test)
    const $li = $('<li class="customer-message">').html(prefix + msg.utterance + "<span>" + moment(new Date()).format('lll') + "</span>");
    connectedCustomers[msg.customerId]
      .window
      .append($li);
    
    scrollToBottom(connectedCustomers[msg.customerId]
      .window
      .append($li))
  };

  // Automatically scroll down when new message added
  function scrollToBottom($li){
    console.log("scrolling")
    console.log($li.offset().top)
    $li.animate({
      scrollTop: $li.offset().top * 10000
   }, 0); 
  }

  // function that will show the sentiment analysis result
  var notifyUserFeelings = function (customer_sentiment){
    // console.log(customer_sentiment)
    // console.log(customer_sentiment.sentiment.score)

    // It will only show the notification if the emotion is negative
    if(customer_sentiment.sentiment.feeling == 'negative'){
      $('.notification')
        .append($('<li class="angry">')
        .append($('<p class="username">').text('Customer: ' + customer_sentiment.username))
        .append($('<p class="feeling">').text('Status: ' + customer_sentiment.sentiment.feeling))
        // .append($('<p class="score">').text(customer_sentiment.sentiment.score))
        .append($('<p class="customer_id">').text('CustomerID: ' +customer_sentiment.id)));
  
    }

  // function to change the customer tabs to the target tab once clicked
  $( ".angry" ).click(function() {
    var $this = $(this);
    var customer_id = $this.text().split("/")
    const arr = $this.text().split(" ")
    var target = "/" +customer_id[1];
    setCurrentTab(connectedCustomers[target]);
    this.remove();
  });
  }

  var testing = function(message){
    console.log(message)
  }

  // function to retrieve old user message
  var receiveOldMessage = function(msg){
    if(!connectedCustomers[msg.customerId]) {
      console.log('Received message for unknown customer id: ' + JSON.stringify(msg));
      return;
    }
    if(msg.message.message){
      if(msg.message.userType === 'disconnect'){
        const $li = $('<li class="customer-message">').html("-----" + msg.message.message + "-----" + "<span>" + moment(msg.createdAt).format('lll') + "</span>");
        connectedCustomers[msg.customerId]
          .window
          .append($li);
        scrollToBottom(connectedCustomers[msg.customerId]
          .window
          .append($li))
      }
      else{
        const $li = $('<li class="customer-message">').html('Customer: ' + msg.message.message + "<span>" + moment(msg.createdAt).format('lll') + "</span>");
        connectedCustomers[msg.customerId]
          .window
          .append($li);
        scrollToBottom(connectedCustomers[msg.customerId]
          .window
          .append($li))
      }

    }
    if(msg.message.agentMessage){
      var agentMsg = msg.message.agentMessage[0];
      console.log(agentMsg)
      // if(Array.isArray(msg.message.agentMessage)){
      //   msg.message.agentMessage.forEach(agentMessage => {
      //     agentMsg = agentMessage;
      //   })
      // }
      if(Array.isArray(agentMsg)){
        agentMsg.forEach(message =>{
          console.log(message)
          const $li = $('<li class="customer-message">').html('Agent: ' + message + "<span>" + moment(msg.createdAt).format('lll') + "</span>");
          connectedCustomers[msg.customerId]
            .window
            .append($li);
          scrollToBottom(connectedCustomers[msg.customerId]
            .window
            .append($li))

        })
      } else if(agentMsg){
        const $li = $('<li class="customer-message">').html('Agent: ' + agentMsg + "<span>" + moment(msg.createdAt).format('lll') + "</span>");
          connectedCustomers[msg.customerId]
            .window
            .append($li);
          scrollToBottom(connectedCustomers[msg.customerId]
            .window
            .append($li))
      }
      
    }
    if(msg.message.operatorMessage){
      const $li = $('<li class="operator-message">').html(msg.message.operatorMessage + "<span>" + moment(msg.createdAt).format('lll') + "</span>");
      connectedCustomers[msg.customerId]
        .window
        .append($li);
      scrollToBottom(connectedCustomers[msg.customerId]
        .window
        .append($li))

    }
  }

  // Send the alert notification to the human operator for triggering handover action
  var notifyCustomerAlert = function(msg){
    console.log("add customer alert")
    console.log(msg)
    var string = null;
    var count_name = null;
    if(msg.response === 'purchase_mode'){
      string = "Customer, " + "<strong>" + msg.customer.username + "</strong>" +" is try for purchase action."
    }
    else if(msg.response === 'refund_mode'){
      string = "Customer, " + "<strong>" + msg.customer.username + "</strong>" +" is try for refund items."

    }
    else if(msg.response === 'tracking_mode'){
      string = "Customer, " + "<strong>" + msg.customer.username + "</strong>" +" is try for tracking action."
    }
    else if(msg.response === 'chatbot_confused'){
      string = "Customer: " + "<strong>" + msg.customer.username + "</strong><br />" + "Status: <strong>confusing</strong><br />" + "Reason: " + msg.intent  
    }
    else if(msg.response === 'quit_refund'){
      string = "Customer, " + "<strong>" + msg.customer.username + "</strong>" +" is quit for refund flow."    
    }
    else if(msg.response === 'quit_tracking'){
      string = "Customer, " + "<strong>" + msg.customer.username + "</strong>" +" is quit for tracking flow."    
    }
    else if(msg.response === 'quit_purchase'){
      string = "Customer, " + "<strong>" + msg.customer.username + "</strong>" +" is quit for purchase flow."    
    } 
    else if(msg.response === 'human_request'){
      string = "Customer, " + "<strong>" + msg.customer.username + "</strong>" +" is asking for human operator."    
    }

    // there are 3 type of alert which are slim, medium or urgent require for handover action.
    if(msg.hasOwnProperty('count')){
      // console.log("count " + count)
      if(msg.count >= 2 && msg.count < 4){
        count_name = 'slim';
      }else if(msg.count >= 4 && msg.count < 6){
        count_name = 'medium';
      }else if(msg.count >= 6){
        count_name = 'urgent';
      }else {
        count_name = 'alert'
      }
    }
    else if(msg.response === 'human_request'){
      count_name = 'urgent'
    }
    else{
      // console.log("alert_haha")
      count_name = 'alert'
    }
    
    console.log(msg)

    if(string!=null){
      $('.notification')
      .append($('<li class="' + count_name +'">')
      .append($('<p class="' + msg.customerId + '">').html(string))
      .append($('<p class="customer_id">').text('CustomerID: ' + msg.customerId)));
    }

    $( ".slim" ).click(function() {
      var $this = $(this);
      var customer_id = $this.text().split("/")
      var target = "/" +customer_id[1];
      setCurrentTab(connectedCustomers[target]);
      this.remove();
    });
    $( ".medium" ).click(function() {
      var $this = $(this);
      var customer_id = $this.text().split("/")
      var target = "/" +customer_id[1];
      setCurrentTab(connectedCustomers[target]);
      this.remove();
    });
    $( ".urgent" ).click(function() {
      var $this = $(this);
      var customer_id = $this.text().split("/")
      var target = "/" +customer_id[1];
      setCurrentTab(connectedCustomers[target]);
      this.remove();
    });

    $( ".alert" ).click(function() {
      var $this = $(this);
      var customer_id = $this.text().split("/")
      var target = "/" +customer_id[1];
      setCurrentTab(connectedCustomers[target]);
      this.remove();
    });
  }

  // Attach all our event handlers
  socket.on('customer connected', createNewCustomerTab);
  socket.on('customer message', receivedCustomerMessage);
  socket.on('operator requested', notifyOperatorRequest);
  socket.on('operator message', receivedOperatorMessage);
  socket.on('customer disconnected', notifyCustomerDisconnected);
  socket.on('system error', notifySystemError);
  socket.on('customer_feelings', notifyUserFeelings);
  socket.on('customer_alert', notifyCustomerAlert)
  socket.on('receive_old_message', receiveOldMessage);
  socket.on('testing',testing);
  

window.onload=function(){
  getExisitingId();
}
