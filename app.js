const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const request = require('request')

// add session for login admin
const session = require("express-session");

// add login and register function
const express = require('express')
const mongoose = require('mongoose')
const User = require('./model/user')
const bodyParser = require('body-parser')
const connectDB = require('./db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const JWT_SECRET = 'asdasdsandsadnsandsadsa'

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("./public"));
app.engine('html', require('ejs').renderFile)

//create session
const oneDay = 1000*60*60*24;
app.use(session({
  name: 'sid',
  secret:"snfjanjansdosandnsaodnsajnasdjnjas",
  resave: false,
  cookie: {
    maxAge: oneDay,
    // samesite: true,
    // secure: true
  },
  saveUninitialized: false,

}))


// Import the file to store the selected agent type for chatbot system
const AgentStore = new agentStore();

//connect to mongodb
connectDB();

// Load our custom classes
const CustomerStore = require('./customerStore.js');
const MessageRouter = require('./messageRouter.js');

// Grab the service account credentials path from an environment variable
DF_SERVICE_ACCOUNT_PATH="/Users/alden/Downloads/agent-human-handoff-lpvj-7593ff37878f.json"
// const keyPath = process.env.DF_SERVICE_ACCOUNT_PATH;
const keyPath = DF_SERVICE_ACCOUNT_PATH;
if(!keyPath) {
  console.log('You need to specify a path to a service account keypair in environment variable DF_SERVICE_ACCOUNT_PATH. See README.md for details.');
  process.exit(1);
}

// Load and instantiate the Dialogflow client library
const { SessionsClient } = require('dialogflow');
const { type } = require('os');
const exp = require('constants');
const e = require('express');
const dialogflowClient = new SessionsClient({
  keyFilename: keyPath
})

// Grab the Dialogflow project ID from an environment variable
// const projectId = process.env.DF_PROJECT_ID;
DF_PROJECT_ID="agent-human-handoff-lpvj"
const projectId = DF_PROJECT_ID;
if(!projectId) {
  console.log('You need to specify a project ID in the environment variable DF_PROJECT_ID. See README.md for details.');
  process.exit(1);
}

// Instantiate our app
const customerStore = new CustomerStore();
const messageRouter = new MessageRouter({
  request: request,
  customerStore: customerStore,
  dialogflowClient: dialogflowClient,
  projectId: projectId,
  customerRoom: io.of('/customer'),
  operatorRoom: io.of('/operator')
});

app.get('/agent_selection', (req, res) => {
  res.sendFile(`${__dirname}/static/agent_selection.html`);
})

app.get('/home',(req, res) => {
  res.sendFile(`${__dirname}/static/home.html`);
})

app.get('/chatbot-selected', (req,res) =>{
  res.sendFile(`${__dirname}/static/chatbot-selected.html`);
})

app.get('/dashboard', (req,res)=>{
  console.log(req.session.username)
  if(req.session.username){
    res.render(`${__dirname}/static/admin_dashboard.html`,{username: req.session.user, session: req.session})
  }
  else{
    res.sendFile(`${__dirname}/static/login.html`)
  }
})

app.get('/getAdmin', (req,res) => {
  console.log("asdasdasdasd:" + req.session)
  if(req.session.username){
    res.render(`${__dirname}/static/operator.html`,{username: req.session.user, session: req.session})
  }
  else{
    res.sendFile(`${__dirname}/static/login.html`)
  }
})

app.get('/login', (req,res) => {
  if(req.session.username){
    res.render(`${__dirname}/static/admin_dashboard.html`,{username: req.session.user, session: req.session})
  }
  else{
    res.sendFile(`${__dirname}/static/login.html`)
  }
  // res.sendFile(`${__dirname}/static/login.html`)
})

app.get('/registerAdmin', (req, res) =>{
  res.sendFile(`${__dirname}/static/register.html`)
})

app.get('/getCustomer', (req,res) => {
  res.sendFile(`${__dirname}/static/customer.html`)
})

app.get('/success', function (req, res) {
  res.sendFile(`${__dirname}/static/operator.html`)
});

// add admin session testing
app.use('/api/login', function(req, res, next) {
  console.log('your mom is gay')
  next()
})

app.post('/api/login', async (req, res) => {
  // const {username, password } = req.body.username
  console.log(req.body)
  const username = req.body.username
  const password = req.body.password
  // sess = req.session
  // console.log(sess)
  // req.session.username = req.body.username
  // req.session.password = req.body.password
  console.log(username)
  console.log(password)
  const user = await User.findOne({username}).lean()

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
      res.redirect('/dashboard')
    })
    // const token = jwt.sign(
    //   {
    //     id: user._id, 
    //     username: user.username
    //   }, JWT_SECRET)
      // return res.json({status:'ok', data: token})
      // res.redirect('/dashboard')
      // res.redirect('/getAdmin')
    }
  // res.json({status:'error', error:'Invalid Username/ Password!'})
})

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

app.post('/getTable' , (req, res) => {
  console.log(req.body.agent);
  AgentStore.setAgentType(req.body.agent);
  res.redirect('/home')
})

// Serve static html files for the customer and operator clients
// app.get('/customer', (req, res) => {
//   res.sendFile(`${__dirname}/static/customer.html`);
// });

// app.get('/operator', (req, res) => {
//   res.sendFile(`${__dirname}/static/operator.html`);
// });

// Begin responding to websocket and http requests


mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
  messageRouter.handleConnections();
  http.listen(3000, () => {
    console.log('Listening on *:3000');
  });
})
