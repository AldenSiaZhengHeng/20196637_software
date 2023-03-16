const AppConstants = require('./appConstants.js');
const ChatConnectionHandler = require('./chatConnectionHandler.js');

// Handles the connection to an individual customer
class CustomerConnectionHandler extends ChatConnectionHandler {
  constructor (socket, messageRouter, onDisconnect) {
    super(socket, messageRouter, onDisconnect);
    // In this sample, we use the socket's unique id as a customer id.
    this.init(socket.id);
    this.attachHandlers();
  }
  
  // the store customer id function might be able to put here
  // this part might need to changing to send welcome event to customer then send connection status to operator
  init (customerId) {
    console.log('A customer joined: ', this.socket.id);
    // this.router._sendConnectionStatusToOperator(customerId)
    // Determine if this is a new or known customer
      // .then(() => this.router.customerStore.getOrCreateCustomer(customerId))
    this.router.customerStore.getOrCreateCustomer(customerId)
      .then(customer => {
        // console.log('A customer connected: ', customer);
        // console.log("hey I'm micket mouse")
        // console.log(this.router.customerStore.getAllCustomer())
        // console.log("hey I'm micket mouse") 
        // If new, begin the Dialogflow conversation

        // need to change this, only trigger if the username is know
        if (customer.isNew) {
          return this.router._welcomeEventToCustomer(customer, customerId)
          // return this.router._sendEventToAgent(customer)
            .then(responses => {
              const response = responses.answer;
              this._respondToCustomer(response, this.socket);
              // const response = responses[0];
              // this._respondToCustomer(response.queryResult.fulfillmentText, this.socket);
            });
        }
        // If known, do nothing - they just reconnected after a network interruption
      })
      .catch(error => {
        // Log this unspecified error to the console and
        // inform the customer there has been a problem
        console.log('Error after customer connection: ', error);
        this._sendErrorToCustomer(error);
      });
  }

  attachHandlers () {
    // this.socket.on(AppConstants.EVENT_OPERATOR_MESSAGE, (message) => {
    this.socket.on('customer-details', (data) =>{
      // this.router.customerStore.setCustomer(this.socket.id, data)
      this.router.customerStore.pushToExisitingStore(this.socket.id, data);
      this.router._sendConnectionStatusToOperator(this.socket.id)
      // console.log(this.router.customerStore.retrieve(this.socket.id))
    });

    this.socket.on(AppConstants.EVENT_CUSTOMER_MESSAGE, (message) => {
      console.log('Received customer message: ', message);
      this._gotCustomerInput(message);
    });
    this.socket.on(AppConstants.EVENT_DISCONNECT, () => {
      console.log('Customer disconnected');
      this.router._sendConnectionStatusToOperator(this.socket.id, true);
      this.onDisconnect() ;
    });
  }

  _checkPurchaseId(purchaseId){

  }

  // Called on receipt of input from the customer
  _gotCustomerInput (utterance) {
    // Look up this customer
    this.router.customerStore
      .getOrCreateCustomer(this.socket.id)
        .then(customer => {
          // process customer message in messageRouter
          return this.router._routeCustomer(utterance, customer, this.socket.id);
        })
        .then(response => {
          // Send any response back to the customer
          if (response) {
            console.log("return response to customer")
            return this._respondToCustomer(response.answer, this.socket);
          }
        })
      .catch(error => {
        // Log this unspecified error to the console and
        // inform the customer there has been a problem
        console.log('Error after customer input: ', error);
        this._sendErrorToCustomer(error);
      });
  }

  // Send a message or an array of messages to the customer
  _respondToCustomer (response) {
    console.log('Sending response to customer:', response);
    if (Array.isArray(response)) {
      response.forEach(message => {
        this.socket.emit(AppConstants.EVENT_CUSTOMER_MESSAGE, message);
      });
      return;
    }
    this.socket.emit(AppConstants.EVENT_CUSTOMER_MESSAGE, response);
    // We're using Socket.io for our chat, which provides a synchronous API. However, in case
    // you want to swich it out for an async call, this method returns a promise.
    return Promise.resolve();
  }

  _sendErrorToCustomer () {
    // Immediately notifies customer of error
    console.log('Sending error to customer');
    this.socket.emit(AppConstants.EVENT_SYSTEM_ERROR, {
      type: 'Error',
      message: 'There was a problem.'
    });
  }
}

module.exports = CustomerConnectionHandler;
