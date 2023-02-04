function codeAddress (){
  socket.emit('retrieve_existing_id', 'makabaka')
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
    socket.emit('operator message', messageObject(currentTab.customerId, messageText));
    $('#m').val('');
    return false;
  });

  // Switch to a different tab
  var setCurrentTab = function(target) {
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
  };

  // Create a set of UI elements for a new customer tab.
  // The customerId is the ID used internally by for websocket communication.
  // In your implementation, you could replace this with the customer's name
  // after fetching it from your datastore.
  var createNewCustomerTab = function(customerId) {
    console.log('ethics')
    var newChatElements = {};
    newChatElements.customerId = customerId;
    // A tab displaying the customer id
    newChatElements.tab = $('<li class="chat-tab">').text(customerId);
    // The chat log for this customer
    newChatElements.window = $('<ul class="chat-window">').hide();

    var clickHandler = function() {
      setCurrentTab(newChatElements);
    };
    newChatElements.tab.click(clickHandler);

    connectedCustomers[customerId] = newChatElements;

    if(!currentTab) {
      console.log('Setting current tab');
      clickHandler();
    }

    $('#chatTabs').append(newChatElements.tab);
    $('#chatWindows').append(newChatElements.window);
  };

  // Notify the operator that a customer has requested them
  var notifyOperatorRequest = function(customerId) {
    if(!connectedCustomers[customerId]) {
      console.log('Received operator request from unknown customer id: ' + customerId);
      return;
    }
    setCurrentTab(connectedCustomers[customerId]);
    // alert('Operator requested!');
  };

  // Notify the operator that a customer has disconnected
  var notifyCustomerDisconnected = function(customerId) {
    if(!connectedCustomers[customerId]) {
      console.log('Received disconnect notification for unknown customer id: ' + customerId);
      return;
    }
    connectedCustomers[customerId].disconnected = true;
    connectedCustomers[customerId]
      .window
      .append($('<li class="customer-message">')
      .text('--- Customer disconnected ---'));
    console.log("li:eq('"+customerId+"')")
    connectedCustomers[customerId].tab.remove();
    connectedCustomers[customerId].window.remove();
    socket.emit('delete_disconnect_id',customerId)
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
    currentTab.window.append($('<li class="operator-error">').text(errorText));
  };

  // Display messages sent by any operator to the customers this operator knows about
  var receivedOperatorMessage = function(msg) {
    console.log(msg)
    var customer = connectedCustomers[msg.customerId];
    if(!customer) {
      console.log('Received operator message to unknown customer id: ' + JSON.stringify(msg));
      return;
    }
    customer.window
      .append($('<li class="operator-message">').append($('<p class="message">').text(msg.utterance)));
    // addMessageToUI(msg.utterance, customer)
    // customer.window
    //   .append($('<li class="operator-message">').text(msg.utterance));
  };

  // Display messages sent by customers
  var receivedCustomerMessage = function(msg) {
    if(!connectedCustomers[msg.customerId]) {
      console.log('Received message for unknown customer id: ' + JSON.stringify(msg));
      return;
    }
    // If your implementation has access to the customer's name,
    // you can modify the next line to display it in the prefix.
    var prefix = msg.isAgentResponse ? 'Agent: ' : 'Customer: ';
    connectedCustomers[msg.customerId]
      .window
      .append($('<li class="customer-message">')
      .toggleClass('agent-response', msg.isAgentResponse)
      .text(prefix + msg.utterance));
  };

  // function addMessageToUI(message, customer){
  //   customer.window
  //     .append($('<li class="operator-message">').append($('<p class="message">').text(message))
  //     )
  //   // scrollToBottom()
  // } 
  // Attach all our event handlers
  socket.on('customer connected', createNewCustomerTab);
  socket.on('customer message', receivedCustomerMessage);
  socket.on('operator requested', notifyOperatorRequest);
  socket.on('operator message', receivedOperatorMessage);
  socket.on('customer disconnected', notifyCustomerDisconnected);
  socket.on('system error', notifySystemError);

window.onload = codeAddress;
