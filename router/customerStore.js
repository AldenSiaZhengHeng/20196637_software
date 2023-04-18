// This file will create and save the user information in json format instead into database
// The user details will be stored here instead of creating account to simulate a real-life customer service chatbot


class CustomerStore {
  constructor () {
    this.customers = {};
    this.count = 0;
  }

  static get MODE_AGENT () {
    return 'AGENT';
  }

  static get MODE_OPERATOR () {
    return 'OPERATOR';
  }

  static get MODE_OPERATOR_GUIDE (){
    return 'OPERATOR_GUIDE';
  }

  // function to set new customer into the json array
  getOrCreateCustomer (customerId) {
    if (!customerId || customerId.length === 0) {
      return Promise.reject(new Error('You must specify a customer id'));
    }

    const customerData = this.retrieve(customerId);

    // If there was no customer with this id, create one
    if (!customerData) {
      console.log('Storing new customer with id: ', customerId);
      return this
        .setCustomer(customerId, {
          id: customerId,
          mode: CustomerStore.MODE_AGENT,
          agent: null,
          username: null
        })
        .then((newCustomer) => {
          // Attach this temporary flag to indicate that the customer is
          // freshly created.
          newCustomer.isNew = true;
          return newCustomer;
        });
    }

    return Promise.resolve(customerData);
  }

  
  // set the customer information to the json array
  setCustomer (customerId, customerData) {
    // console.log('CustomerStore.setCustomer called with ', customerData);
    if (!customerId || customerId.length === 0 || !customerData) {
      return Promise.reject(new Error('You must specify a customer id and provide data to store'));
    }
    // console.log('Updating customer with id: ', customerId);
    this.store(customerId, customerData);

    return Promise.resolve(customerData);
  }

  // This function could be modified to support persistent database storage
  store (customerId, data) {
    this.customers[customerId] = JSON.stringify(data);
    
  }

  // update the existing information or data to the json object exist in the json array
  pushToExisitingStore(customerId, customerData) {
    var obj = JSON.parse(this.customers[customerId])
    var socketId = obj['id']
    var mode = obj['mode']
    var username = customerData.username;
    var agent = customerData.agent;
    let data = {
      id: socketId,
      mode: mode,
      username: username,
      agent: agent
    }
    this.customers[customerId] = JSON.stringify(data);
  }

  // This function could be modified to support persistent database storage
  retrieve (customerId) {
  
    const customerData = this.customers[customerId];
    return customerData ? JSON.parse(customerData) : null;
  }

  // retrieve the array that store all customer information
  getAllCustomer(){
    return this.customers;
  }

  // remove the customer's information that store in the array
  deleteCustomer(customerId){
    var list = this.getAllCustomer()
    var name_list = JSON.stringify(list)
    var objective = JSON.parse(name_list)
    for(var id in list){
      // console.log("hello_Store")
      // console.log(objective[id])
      var check = JSON.parse(objective[id])
      if(customerId == check['id']){
        delete this.customers[id]
      }
    } 

  }


}

module.exports = CustomerStore;
