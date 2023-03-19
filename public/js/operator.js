function getExisitingId (){
  socket.emit('retrieve_existing_id', 'makabaka')
  socket.emit('getMessage','wtfe')


  // socket.emit('getMessage','getMessage')
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
  // When the form is submitted, send an operator message to the server, referencing
  // the current tab's customer
  $('form').submit(function(){
    if(currentTab.disconnected) {
      // alert('This customer has disconnected');
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

  // Switch to a different tab
  var setCurrentTab = function(target) {
    console.log("change-tab")
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

  // Create a set of UI elements for a new customer tab.
  // The customerId is the ID used internally by for websocket communication.
  // In your implementation, you could replace this with the customer's name
  // after fetching it from your datastore.
  var createNewCustomerTab = function(customer) {
    console.log('ethics')
    console.log(customer)
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
    console.log(connectedCustomers)
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
    // connectedCustomers[customerId].tab.remove();
    // connectedCustomers[customerId].window.remove();
    // socket.emit('delete_disconnect_id',customerId)
    // alert('Customer: ' + customerId +' has disconnect')
  };

  // Notify the operator of a system error
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
    console.log(errorText);
    if(!currentTab) return;
    const $li = $('<li class="operator-error">').text(errorText)
    currentTab.window.append($li);
    scrollToBottom(currentTab.window.append($li))
  };

  // Display messages sent by any operator to the customers this operator knows about
  var receivedOperatorMessage = function(msg) {
    console.log(msg)
    var customer = connectedCustomers[msg.customerId];
    if(!customer) {
      console.log('Received operator message to unknown customer id: ' + JSON.stringify(msg));
      return;
    }
    const $li = $('<li class="operator-message">').html(msg.utterance + "<span>" + moment(new Date()).format('lll') + "</span>");
    customer.window
      .append($li);
    
    scrollToBottom(customer.window.append($li));
    // addMessageToUI(msg.utterance, customer)
    // customer.window
    //   .append($('<li class="operator-message">').text(msg.utterance));
  };

  // Display messages sent by customers
  var receivedCustomerMessage = function(msg) {
    console.log(connectedCustomers)
    if(!connectedCustomers[msg.customerId]) {
      console.log('Received message for unknown customer id: ' + JSON.stringify(msg));
      return;
    }
    // If your implementation has access to the customer's name,
    // you can modify the next line to display it in the prefix.
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
      // .toggleClass('agent-response', msg.isAgentResponse)
  };

  function scrollToBottom($li){
    console.log("scrolling")
    // var offset = $('.customer-message').offset().top;
    // $('.chat-window').animate({
    //     scrollTop: offset
    // }, 0)
    console.log($li.offset().top)
    $li.animate({
      scrollTop: $li.offset().top * 10000
   }, 0); 
  //   $('.chat-window').animate({
  //     scrollTop: $li.offset().top * 12
  //  }, 0); 

  }

  var notifyUserFeelings = function (customer_sentiment){
    console.log(customer_sentiment)
    console.log(customer_sentiment.sentiment.score)
    if(customer_sentiment.sentiment.feeling == 'negative'){
        // .append($('<li class="notification-list>').append($('<p class="score">').text(customer_sentiment.sentiment.score)));
      // .append('<br />')
      $('.notification')
        .append($('<li class="angry">')
        .append($('<p class="username">').text('Customer: ' + customer_sentiment.username))
        .append($('<p class="feeling">').text('Status: ' + customer_sentiment.sentiment.feeling))
        // .append($('<p class="score">').text(customer_sentiment.sentiment.score))
        .append($('<p class="customer_id">').text('CustomerID: ' +customer_sentiment.id)));
  
          // console.log("hello world")
    }
    // else if(customer_sentiment.sentiment.feeling == 'positive'){
    //   $('.notification')
    //   // .append($('<li class="notification-list>').append($('<p class="score">').text(customer_sentiment.sentiment.score)));
    //       // .append('<br />')
    //       .append($('<li class="happy">')
    //       .append($('<p class="username">').text('Customer: ' + customer_sentiment.username))
    //       .append($('<p class="feeling">').text('Status: ' + customer_sentiment.sentiment.feeling))
    //       // .append($('<p class="score">').text(customer_sentiment.sentiment.score))
    //       .append($('<p class="customer_id">').text('CustomerID: ' +customer_sentiment.id)));
  
    //       // console.log("hello world")
    // }

  // const ul = document.querySelector('.notification');

  // ul.addEventListener('click', function(e) {
  //   this.removeChild(e.target);
  // })
  $( ".angry" ).click(function() {
    var $this = $(this);
    var customer_id = $this.text().split("/")
    console.log('--------')
    const arr = $this.text().split(" ")
    console.log(arr[1])
    console.log(customer_id)
    var target = "/" +customer_id[1];
    console.log(target)
    setCurrentTab(connectedCustomers[target]);
    this.remove();
    // alert("Enter " +  + " chatroom")
  });

  // $( ".happy" ).click(function() {
  //   var $this = $(this);
  //   var customer_id = $this.text().split("/")
  //   var target = "/" +customer_id[1];
  //   setCurrentTab(connectedCustomers[target]);
  //   // $(".happy").remove();
  //   // alert("/" +customer_id[1])
  // });

  }



  var chatbot_suggestion = function(chatbot_suggestion) {
    if(!connectedCustomers[chatbot_suggestion.customerId]) {
      console.log('Received message for unknown customer id: ' + JSON.stringify(chatbot_suggestion));
      return;
    }
    console.log(chatbot_suggestion)
    console.log(chatbot_suggestion.responses.answers.length)
    answers_length = chatbot_suggestion.responses.answers.length;
    answer_length = chatbot_suggestion.responses.answer.length
    var intent = chatbot_suggestion.responses.intent;
    let $li = undefined;
    if(intent == 'user.tracking_number' || intent =='agreement' || intent =='disagremment' || intent == 'user.reason'){
      $li = $('<li class="chatbot-suggestion">').append($('<p class="message">').html(chatbot_suggestion.responses.answer));
            
      console.log("suggestion")
      console.log($li)
      // const $li = $('<li class="chatbot-suggestion">').html(chatbot_suggestion.responses.answers[i].answer);
      connectedCustomers[chatbot_suggestion.customerId]
        .window
        .append($li);
    } else if(Array.isArray(chatbot_suggestion.responses.answer)){
      console.log("get answer")
      console.log("hi")
      chatbot_suggestion.responses.answer.forEach(message =>{
        console.log(message)
        $li = $('<li class="chatbot-suggestion">').append($('<p class="message">').html(message));
        connectedCustomers[chatbot_suggestion.customerId]
          .window
          .append($li);
        scrollToBottom(connectedCustomers[chatbot_suggestion.customerId]
          .window
          .append($li))
      })
    } 
    else{
      for (let i =0; i< answers_length; i++){
        // console.log(chatbot_suggestion.responses.answers[i].answer)
        $li = $('<li class="chatbot-suggestion">').append($('<p class="message">').html(chatbot_suggestion.responses.answers[i].answer));
        
        console.log("suggestion")
        console.log($li)
        // const $li = $('<li class="chatbot-suggestion">').html(chatbot_suggestion.responses.answers[i].answer);
        connectedCustomers[chatbot_suggestion.customerId]
          .window
          .append($li);
        scrollToBottom(connectedCustomers[chatbot_suggestion.customerId]
          .window
          .append($li))
      }
    } 


    $( ".message" ).click(function() {
      if(Array.isArray(chatbot_suggestion.responses.answer)){
        var $this = $(this);
        socket.emit('operator message', messageObject(currentTab.customerId, $this.html()));
        $this.remove();
      }else{
        var $this = $(this);
        console.log("show message")
        console.log($this.html())
        socket.emit('operator message', messageObject(currentTab.customerId, $this.html()));
        $(".chatbot-suggestion").remove();
      }

      // alert("/" +customer_id[1])
    });
    // const $li = $('<li class="chatbot-suggestion">').html(prefix + msg.utterance);
    // connectedCustomers[msg.customerId]
    //   .window
    //   .append($li);
    
    // scrollToBottom($li)
  }

  var testing = function(message){
    console.log(message)
  }

  // function to get old user message
  var receiveOldMessage = function(msg){
    console.log(msg)
    console.log(moment(msg.createdAt).format('lll'))
    // console.log(connectedCustomers)
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

  var notifyCustomerAlert = function(msg){
    console.log("add customer alert")
    console.log(msg)
    $('.notification')
    .append($('<li class="alert">')
    .append($('<p class="' + msg.customerId + '">').html("Customer, " + "<strong>" + msg.customer.username + "</strong>" +" is confusing"))
    .append($('<p class="customer_id">').text('CustomerID: ' + msg.customerId)));

    $( ".alert" ).click(function() {
      var $this = $(this);
      var customer_id = $this.text().split("/")
      var target = "/" +customer_id[1];
      setCurrentTab(connectedCustomers[target]);
      this.remove();
      // $(".happy").remove();
      // alert("/" +customer_id[1])
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
  socket.on('chatbot_suggestion', chatbot_suggestion);
  socket.on('receive_old_message', receiveOldMessage);
  socket.on('testing',testing);

window.onload=function(){
  getExisitingId();
  // getMessage();
}
// window.onload = codeAddress;
