// App.js file is the main component in this project which is act as a server

const app = require('express')();
const http = require('http').createServer(app)
const io = require('socket.io')(http, {wsEngine: 'ws'});
const request = require('request')

// add session for login admin
const session = require("express-session");
var path = require('path');


const express = require('express')
const mongoose = require('mongoose')
const User = require('../model/user')
const purchases = require('../model/purchase')
const refundTicket = require('../model/refund_ticket')
const bodyParser = require('body-parser')
const connectDB = require('../database/db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const JWT_SECRET = 'asdasdsandsadnsandsadsa'

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("./public"));
// app.use(express.static("./router"));
// app.use(express.static("./static"))
app.engine('html', require('ejs').renderFile)

//create cookie session
const oneDay = 1000*60*60*24;
app.use(session({
  name: 'sid',
  secret:"snfjanjansdosandnsaodnsajnasdjnjas",
  resave: false,
  cookie: {
    maxAge: oneDay,
  },
  saveUninitialized: false,

}))



//connect to mongodb
connectDB();

// Load our custom classes
const CustomerStore = require('../router/customerStore.js');
const MessageRouter = require('../router/messageRouter.js');

// Grab the service account credentials path from an environment variable
DF_SERVICE_ACCOUNT_PATH="/Users/alden/Downloads/agent-human-handoff-lpvj-7593ff37878f.json"
// const keyPath = process.env.DF_SERVICE_ACCOUNT_PATH;
const keyPath = DF_SERVICE_ACCOUNT_PATH;
if(!keyPath) {
  console.log('You need to specify a path to a service account keypair in environment variable DF_SERVICE_ACCOUNT_PATH. See README.md for details.');
  process.exit(1);
}

// Load and instantiate the Dialogflow client library
// const { SessionsClient } = require('dialogflow');
// const { type } = require('os');
// const exp = require('constants');
// const e = require('express');
// const dialogflowClient = new SessionsClient({
//   keyFilename: keyPath
// })

// // Grab the Dialogflow project ID from an environment variable
// // const projectId = process.env.DF_PROJECT_ID;
// DF_PROJECT_ID="agent-human-handoff-lpvj"
// const projectId = DF_PROJECT_ID;
// if(!projectId) {
//   console.log('You need to specify a project ID in the environment variable DF_PROJECT_ID. See README.md for details.');
//   process.exit(1);
// }

// Instantiate our app
const customerStore = new CustomerStore();
const messageRouter = new MessageRouter({
  request: request,
  customerStore: customerStore,
  customerRoom: io.of('/customer'),
  operatorRoom: io.of('/operator')
});

// get and show the home web pages
app.get('/',(req, res) => {
  res.render("../static/home.html")
  // res.sendFile(`${__dirname}/static/home.html`);
})

// get and show the human operator dashboard
app.get('/getAdmin', (req,res) => {
  // if the human operator has login before, directly lead the page to the operator pages
  if(req.session.username){
    res.render("../static/operator.html",{username: req.session.user, session: req.session})
    // res.render(`${__dirname}/static/operator.html`,{username: req.session.user, session: req.session})
  }
  // or else lead to login pages
  else{
    res.sendFile(path.join(__dirname, '../static/login.html'))
  }
})

// get and show the purchase pages to perform purchase request order at human operator sides
app.get('/getPurchase' ,(req,res) =>{
  if(req.session.username){
    res.render("../static/purchase.html",{username: req.session.user, session: req.session})
    // res.render(`${__dirname}/static/operator.html`,{username: req.session.user, session: req.session})
  }
  else{
    res.sendFile(path.join(__dirname, '../static/login.html'))
  }
})

// get and show the refund pages to perform refund request order at human operator sides
app.get('/getRefund' ,(req,res) =>{
  if(req.session.username){
    res.render("../static/refund.html",{username: req.session.user, session: req.session})
    // res.render(`${__dirname}/static/operator.html`,{username: req.session.user, session: req.session})
  }
  else{
    res.sendFile(path.join(__dirname, '../static/login.html'))
  }
})

// get and show the refund pages to perform refund request order at human operator sides
app.get('/getHistory' ,(req,res) =>{
  if(req.session.username){
    res.render("../static/chat_history.html",{username: req.session.user, session: req.session})
    // res.render(`${__dirname}/static/operator.html`,{username: req.session.user, session: req.session})
  }
  else{
    res.sendFile(path.join(__dirname, '../static/login.html'))
  }
})


// get and show the login page for human operator
app.get('/login', (req,res) => {
  if(req.session.username){
    res.render("../static/operator.html",{username: req.session.user, session: req.session})
  }
  else{
    res.sendFile(path.join(__dirname, '../static/login.html'))
  }
})

// get and show the register page for human operator
app.get('/registerAdmin', (req, res) =>{
  res.sendFile(path.join(__dirname, '../static/register.html'))
})

// get and show the customer web pages 
app.get('/getCustomer', (req,res) => {
  res.sendFile(path.join(__dirname, '../static/customer.html'))
})

// check the validation of tracking number when performing refund request by the human operator when handover occur
app.post('/api/checking_trackNum', async (req,res)=>{
  console.log(req.body)
  const tracking_number = req.body.tracking_number;
  try{
    const result = await purchases
    .find({
        trackingNumber:tracking_number
    })
    if(result.length > 0){
      var item_list = result[0].item; 
      console.log(result)
      console.log(item_list)
      return res.json({status:'ok', result:result[0]})
    }
  }catch(e){

  }
})

// create the refund ticket by human operator manually after handover
// this will return the refund ticket number once created successfully
app.post('/api/refund', async (req,res)=>{
  console.log(req.body)
  const tracking_number = req.body.tracking_number;
  const username = req.body.username
  const reason = req.body.user_reason
  const item = req.body.item
  let result = '';
  const characters = '0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < 20) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  const refund_ticket = result;
  let ticket ={
    RefundTicketId: refund_ticket,
    TrackingNumber: tracking_number,
    username: username,
    item: item,
    reason: reason,
    status: 'pending'
  }

  try{
    const m = new refundTicket(ticket);
    await m.save();
    return res.json({status:'ok', refund_ticket:refund_ticket})
  } catch (e){
    console.log(e.text())
    return res.json({status:'error', error:e})
  }

})

// create the purchase request order by human operator manually after handover
// this will return the refund tracking number once store successfully into database
app.post('/api/purchase', async (req, res)=> {
  console.log(req.body)
  let result = '';
  const characters = '0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < 20) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  const tracking_number = result;
  const customer_name = req.body.customer_name;
  const item = req.body.item;
  const location = req.body.location;
  
  console.log(req.body)
    
  let basket = {
    trackingNumber: tracking_number,
    username: customer_name,
    item: item,
    location: location,
    status: 'pending'
  }
  try{
    const m = new purchases(basket);
    await m.save();
    return res.json({status:'ok', tracking_number:tracking_number})

  } catch (e){
    return res.json({status:'error', error:e})
  }
  
})

// validate the username and password when the human operator try to login in and enter the dashboard pages
app.post('/api/login', async (req, res) => {
  // const {username, password } = req.body.username
  console.log(req.body)
  const username = req.body.username
  const password = req.body.password
  sess = req.session
  console.log(sess)
  req.session.username = req.body.username
  req.session.password = req.body.password
  console.log(username)
  console.log(password)
  const user = await User.findOne({username}).lean()
  console.log(user)
  if(!user) {
    return res.json({status:'error', error:'Invalid Username/ Password!'})
  }

  if(await bcrypt.compare(password, user.password)) {
    req.session.regenerate(function(err) {
      if(err){
        return res.json({status:'error', error:'Failed to Login'})
      }
      req.session.username = username
      req.session.password = password
      const token = jwt.sign(
        {
          id: user._id, 
          username: user.username
        }, JWT_SECRET,
        {
          expiresIn: "24h",
        })
      return res.json({status:'ok', data: token})
    })
  }
})

// register and hashing the password when the humen opreator try to register a new account
// the password will be encrypted before store in to the database
app.post('/api/register' ,async (req, res) => {
  console.log(req.body)
  const { username, password: plainTextPassword } = req.body

  if(!username || typeof username !== 'string') {
    return res.json({status:'error', error:'Invalid Username!'})
  }

  if(!plainTextPassword || typeof plainTextPassword !== 'string') {
    return res.json({status:'error', error:'Invalid Password!'})
  }

  const password = await bcrypt.hash(plainTextPassword, 10)

  try {
    const response = await User.create({
      username,
      password
    })
    console.log('User creaetd successfully: ',response)
  } catch(error){

    //duplicate username handled
    if(error.code === 11000) {
      return res.json({status:'error', error:'Username has already been registered!'})
    }
    console.log(error)
    return res.json({status:error})
  }
  res.json({status:'ok'})
})

// process the logout action for the human operator
app.get('/logout', (req,res)=> {
  sess = req.session;
  sess.destroy(function(err) {
    if(err) {
      res.send("Unable to logout")
    }
    else {
      res.redirect('/home')
    }
  })
})


// Begin responding to websocket and http requests
// only start the server when the mongodb is connected
mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
  messageRouter.handleConnections();
  http.listen(3000, () => {
    console.log('Listening on *:3000');
  });
})
