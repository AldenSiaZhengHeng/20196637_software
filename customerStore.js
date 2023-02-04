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

  

  setCustomer (customerId, customerData) {
    console.log('CustomerStore.setCustomer called with ', customerData);
    if (!customerId || customerId.length === 0 || !customerData) {
      return Promise.reject(new Error('You must specify a customer id and provide data to store'));
    }
    console.log('Updating customer with id: ', customerId);
    this.store(customerId, customerData);

    return Promise.resolve(customerData);
  }

  // This function could be modified to support persistent database storage
  store (customerId, data) {
    //if customer already in the list, return null
    // var list = this.getAllCustomer()
    // var string = JSON.stringify(list);
    // var objectiveValue = JSON.parse(string);
    // console.log(typeof objectiveValue);
    // var count = Object.keys(objectiveValue).length;
    // for(let i=0; i<count; i++){
    //   console.log(objectiveValue[i])
    //   var test = JSON.parse(objectiveValue[i])
    //   if(customerId == test['id']) {
    //     this.customers[i] = JSON.stringify(data)
    //     return null;
    //   }
    // }
    // In this case we just simulate serialization to an actual datastore
    // this.customers[this.count] = JSON.stringify(data);
    // this.count++;
    this.customers[customerId] = JSON.stringify(data);
    
  }

  pushToExisitingStore(customerId, customerData) {
    // var old_Data = this.customers[customerId] = JSON.stringify(data);
    var obj = JSON.parse(this.customers[customerId])
    var socketId = obj['id']
    var mode = obj['mode']
    var username = customerData.username;
    var agent = customerData.agent;
    console.log(username)
    console.log(agent)
    console.log(socketId)
    console.log(mode)
    let data = {
      id: socketId,
      mode: mode,
      username: username,
      agent: agent
    }
    this.customers[customerId] = JSON.stringify(data);
    console.log(this.customers[customerId])
    console.log(data)
    console.log('hahaah')
    // obj.push(customerData)
    // console.log(obj)
    // console.log('hahaah')
  }

  // This function could be modified to support persistent database storage
  retrieve (customerId) {
    // var list = this.getAllCustomer()
    // var name_list = JSON.stringify(list)
    // var objective = JSON.parse(name_list)
    // for(var id in list){
    //   console.log("hello_retrieve")
    //   console.log(objective[id])
    //   var check = JSON.parse(objective[id])
    //   if(customerId == check['id']){
    //     return check;
    //   }
    // } 
    // In this case we just simulate deserialization from an actual datastore
    // var list = this.getAllCustomer()
    // var string = JSON.stringify(list);
    //   var objectiveValue = JSON.parse(string);
    //   console.log(typeof objectiveValue);
    //   console.log("apa khabar")
    //   console.log(objectiveValue)
    //   var count = Object.keys(objectiveValue).length;
    //   for(let i=0; i<count; i++){
    //     console.log(objectiveValue[i])
    //     if (JSON.parse(objectiveValue[i]) != null){
    //       var test = JSON.parse(objectiveValue[i])
    //     }
    //     else {
    //       return null;
    //     }
    //     if(customerId == test['id'])
    //     return test;
    //   }
    //   return null;
    console.log(this.customers)
    console.log(customerId)
    const customerData = this.customers[customerId];
    console.log(customerData)
    return customerData ? JSON.parse(customerData) : null;
  }

  getAllCustomer(){
    return this.customers;
  }

  deleteCustomer(customerId){
    var list = this.getAllCustomer()
    var name_list = JSON.stringify(list)
    var objective = JSON.parse(name_list)
    for(var id in list){
      console.log("hello_Store")
      console.log(objective[id])
      var check = JSON.parse(objective[id])
      if(customerId == check['id']){
        delete this.customers[id]
      }
    } 

    // var list = this.getAllCustomer()
    // var string = JSON.stringify(list);
    //   var objectiveValue = JSON.parse(string);
    //   console.log(typeof objectiveValue);
    //   var count = Object.keys(objectiveValue).length;
    //   for(let i=0; i<count; i++){
    //     console.log(objectiveValue[i])
    //     var test = JSON.parse(objectiveValue[i])
    //     if (JSON.parse(objectiveValue[i]) != null){
    //       var test = JSON.parse(objectiveValue[i])
    //     }
    //     else {
    //       continue;
    //     }
    //     if(customerId == test['id']){
    //       delete this.customers[i]
    //       return; 
    //     }
        // var test = JSON.parse(objectiveValue[i])
        // if(customerId == test['id'])
        // delete objectiveValue;
      // }
  }


}

module.exports = CustomerStore;
