// This file contain the JQuery functions for human operator sides to connect to the server and the customer sides with socket.io to perform several action

// This function is to retrieve the past username and chat history from database once the page load
function getExisitingName (){
    socket.emit('retrieve_existing_name', 'retrieve_existing_id')
    // socket.emit('getMessage','getMessage')
  
  }
  
    var socket = io('/operator');
    // UI elements for all the customers we currently aware of
    var connectedCustomers = {};
    // Pointer to the currently open tab
    var currentTab;
    
  
    // Switch to a different tab of different users
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
  
    // This will create new customer tab based on the usename
    var createoldCustomerTab = function(customer) {
      console.log('ethics')
      console.log(customer)
      var newChatElements = {};
      newChatElements.customerName = customer;
      // A tab displaying the customer id
      newChatElements.tab = $('<li class="chat-tab">').html(customer);
      // The chat log for this customer
      newChatElements.window = $('<ul class="chat-window">').hide();
  
      var clickHandler = function() {
        setCurrentTab(newChatElements);
      };
      newChatElements.tab.click(clickHandler);
  
      connectedCustomers[customer] = newChatElements;
      console.log(connectedCustomers)
      if(!currentTab) {
        console.log('Setting current tab');
        clickHandler();
      }
  
      $('.chatTabs').append(newChatElements.tab);
      $('.chatWindows').append(newChatElements.window);
    };
  
  
    // Automatically scroll down when new message added
    function scrollToBottom($li){
      console.log("scrolling")
      console.log($li.offset().top)
      $li.animate({
        scrollTop: $li.offset().top * 10000
     }, 0); 
    }
  
  
    // function to retrieve old user message
    var receivehistoryMessage = function(msg){

      if(!connectedCustomers[msg.customerName]) {
        console.log('Received message for unknown customer id: ' + JSON.stringify(msg));
        return;
      }
      if(msg.message.message){
        if(msg.message.userType === 'disconnect'){
          const $li = $('<li class="customer-message">').html("-----" + msg.message.message + "-----" + "<span>" + moment(msg.createdAt).format('lll') + "</span>");
          connectedCustomers[msg.customerName]
            .window
            .append($li);
          scrollToBottom(connectedCustomers[msg.customerName]
            .window
            .append($li))
        }
        else{
          const $li = $('<li class="customer-message">').html('Customer: ' + msg.message.message + "<span>" + "Handover Type: " + msg.message.agent +"</span>" + "<span>" + moment(msg.createdAt).format('lll') + "</span>");
          connectedCustomers[msg.customerName]
            .window
            .append($li);
          scrollToBottom(connectedCustomers[msg.customerName]
            .window
            .append($li))
        }
  
      }
      if(msg.message.agentMessage){
        var agentMsg = msg.message.agentMessage[0];
        if(Array.isArray(agentMsg)){
          agentMsg.forEach(message =>{
            console.log(message)
            const $li = $('<li class="customer-message">').html('Agent: ' + message + "<span>" + moment(msg.createdAt).format('lll') + "</span>");
            connectedCustomers[msg.customerName]
              .window
              .append($li);
            scrollToBottom(connectedCustomers[msg.customerName]
              .window
              .append($li))
  
          })
        } else if(agentMsg){
          const $li = $('<li class="customer-message">').html('Agent: ' + agentMsg + "<span>" + moment(msg.createdAt).format('lll') + "</span>");
            connectedCustomers[msg.customerName]
              .window
              .append($li);
            scrollToBottom(connectedCustomers[msg.customerName]
              .window
              .append($li))
        }
        
      }
      if(msg.message.operatorMessage){
        const $li = $('<li class="operator-message">').html(msg.message.operatorMessage + "<span>" + moment(msg.createdAt).format('lll') + "</span>");
        connectedCustomers[msg.customerName]
          .window
          .append($li);
        scrollToBottom(connectedCustomers[msg.customerName]
          .window
          .append($li))
  
      }
    }
  
    // Attach all our event handlers
    socket.on('old customer name', createoldCustomerTab);
    socket.on('receive_history_message', receivehistoryMessage);
    
  // trigger the function once the page load
  window.onload=function(){
    getExisitingName();
  }
  