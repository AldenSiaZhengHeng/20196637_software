# This file will explain each of the files that has been created

Github repo:
https://github.com/AldenSiaZhengHeng/20196637_software

# Library require
1. This hybrid chatbot system is built with Node.js, html/css and jQuery
2. Please ensure you have installed below library before:
    - Node.js

#    How to run project
1. Several folder had been created and each of the files are significant to run a hybrid chatbot system web applications

2. **To run the project:**
    - open the terminal where the project located
    - enter "npm install"
    - make sure every package required in package.json is installed.
    - enter "npm start" to run the project
    - the web pages will be live in "localhost:3000", you can copy this and paste on the browser.

3. URl to run the project in localhost
    - home page: http://localhost:3000/
    - operator page: http://localhost:3000/getAdmin
    - customer page: http://localhost:3000/getCustomer

4. Registered Admin Account
**********************
    - username: aszh
    - password: 1234
**********************
    - username: abcde
    - password: 123456
**********************

5. For the customer to ask chatbot for tracking:
- Example of tracking number available
*********************************************************
    - tracking number: 62101611441945223842
    - result: 
    {
        Username: A-2
        Tracking Number: 62101611441945223842
        Item: Iphone 14 pro - 4,ASUS ROG phone 6 - 1,Sim Card x 1,Phone case x 1
        Location: Liverpool
        Status: pending
    }
*********************************************************

- Example of refund ticket available
*********************************************************
    - Refund Ticket Number: 78444042221741685047
    -  result: 
    {
        Refund Ticket Number: 51333586212902073068
        Tracking Number: 62101611441945223842
        Username: A-2
        Item: Iphone 14 pro - 4,ASUS ROG phone 6 - 1,Sim Card x 1,Phone case x 1
        Reason: the screen is cracked,when i open the package when received, the iphone 14 pro screen is broken when i unboxed it
        Status: pending
    }
*********************************************************

# Summary
1. This project is to simulate a real-life customer service chatbot to compare and evaluate several handover strategies method in different scenarios created.
2. Hence, there is no authentication of customers since the experiment will not require entering any sensitive information but simulate a customer service chatbot.
3. This project can be acted as a baseline to create a hybrid customer service chatbot system but several important security strategies might need to consider and implement.
4. There will not be any request for the user enter their personal information in both sides as this project is to determine and examine different strategies of handover between human agent and chatbot to improve customer service.

**No personal information will be required**

# Limitations
1. Since this project is just for research purpose, the customer will not require for register but just enter the username and select agent to preform action.
2. The mongodb database provided is without any encryption as this project is to demonstrate a simple chatbot system. Hence, it is better to encrypt the url string if applied for business purpose.


# How to train the chatbot model
1. Change the parameter settings in "nlp.js" package install before training the model to get a more accurate chatbot model.<br />
    - a) open the file node_modules -> @nlpjs -> @neural -> src -> neural-network.js 
    - b) set the defaultSettings to below variable:
        - {
            iterations: 20000,
            errorThresh: 0.00005,
            deltaErrorThresh: 0.000001,
            learningRate: 0.02,
            momentum: 0.5,
            alpha: 0.07,
            log: false,
        }
2. To train a chatbot model:
    - enter "node chatbot_train/train.js" 
    and a model.nlp file will be created.
3. The training will be based on the file in intents folder

# How to create database and connect to it
1. The Mongodb is chosen for storing all of the information in this sytem.
2. This project provide a simple database but if you want to use your own database, you could head to MongoDB official website and build your own database.
    - Register and sign in to the Mongodb
    - create a database
    - go to database access in security session and add new database user by adding username and password
    - go to network access and add your IP address as 0.0.0.0/0 and click "Add Entry."
    - connect to the database by selecting vsc, it will show a link and copy and past to the db.js there in database folder.
    - modify the passwrod in the url string before replace the url string in the db.js



# Instruction of the web pages implement
1. There are 3 differernt component to select which is register admin, admin login and customer
    - Register admin will allow admin to register an account to login to the human operator dashboard
    - Admin login will redirect to the login page which the human operator could enter the username and password to login
    - customer component will direct the user to the customer side to enter username and select agent to start conversation

2. For admin register page, the new admin can enter the new username and password and register. After that, they can login in admin login pages.

3. Once the human operator login, it will redirect to the admin dashboard panel and thee are 4 pages that could select by the human operator which are:
    - dashboard: monitor the conversation of active user with chatbot. The dashboard contain three components which are:
        - customer tabs: show the active user which is clickable allow to enter those active conversation channel

        - chat window: show the message of the user, chatbot and the human operator

        - notification: the sentiment result, alert notification will be shown here to alert human operator to decide handover timing and action.

    - purchase page: perform the purchase request order when the handover occur manually. After sucessfully submit, the tracking number will be shown in below

    - refund page: the refund page contain two part which is allow the human operator to check the validation of tracking number before process refund. After the tracking number is existed, they can enter the details for the refund and submit to get the refund ticket number

    - chat history: show all the past chat history to review, investigate and evaluate the conversation between user, chatbot, and human operator with handover occur.

4. There are side bar where the human operator could choose to direct to other pages to perform purchase or refund request order, review chat history or logout.

# Method to trigger handover in human operator sides
5. The human operator could enter specific keyword: **handover** or **takeover** to take control from the chatbot to chat with customer. After that, they can enter **return** to return control back to chatbot to answer user questions.

**remember the handover only trigger with these specific keyword, you can modify the code to make it more convenience.**

# Customer Side
6. On the customer sides, the user will be requested to enter the username and there are 3 types of agent allow them to select which are:
    - Martin: Explicit Handover Method which will inform user when the handover action happend with a inform message sent to them.

    - Louis: Implicit Handover Method which the handover occur hiddenly without user knowledge to achieve seamless handover. The human operator will act as chatbot to answer user questions which similar to Wizard-Of-Oz method.

    - David: Provide Guidance message instead handover (still can perform handover action if user insist or request)

7. The customer can ask for purchase, refund, tracking or FAQ action.
    - purchase action: Ask the chatbot that to buy phone or add the product shown in the product list into the cart
    - refund action: Ask the chatbot for refund
    - tracking action: Ask the chatbot for tracking package or refund status
    - FAQ: Ask the chatbot about item sold, and the details about it

# How to host the web application
- This project is using Render website to host the web applications for experiemtn.
1. Create a gitub repo and push this whole project folder into github
2. Create an account in Render website.
3. Click web service and link to the github repo that contain the project folder.
4. After that, click connect and fill up the name of the website, select Frankfurt region, choose "Node" as runtime, enter "npm install" on build command and enter "npm start" on start command.
5. Then, select free service and click the button to create web service.


# Instruction of each folder 
* **All of the file contain comment to further illustrate the function.**
* **this section will only brief explain how each file function in the project.**

1. chatbot folder
    - a) chatbot.js
        - this file contain the function to process the user input message and return the predicted intent.
        - if the message is not recognized, it will return "None" as the intent

2. chatbot_training folder
    - a) train.js
        - this file will help to extract the questiosn and answer from the intent file from intents folder to train the chatbot
        - the model will be saved as model.nlp in JSON format

3. evaluation & csv folder
    - a) accuracy.js
        - this file will calculate the accuracy by predicting the input message and compare the predicted intent with actual intent 
        - 100 input with label have been randomly chosen for testing
        - those testing data is obtained with several participant before actual experiment from database.
        - the data that use to perform accuracy evaluation has been labeled and include within this file.
        - you could add more input with correct labelling to test for more result.

    - b) process_intent.js
        - this file will retrieve the user message and intent stored in the database and saved into the csv file which contain in csv folder as predicted_intent.
        - the tester can modify or extract the data from the predicted_intent.csv file and label with correct label before testing.
        - please make sure that there are data contain in the database.

4. database folder
    - a) database.js
        - this file will connect to the databae in mongodb with the url set
- **if you want to use own database, please change the link as this is just for demonstration**

5. intents folder
- this folder contain all of the intent require to train the chatbot
- each of the intent file contain questions and answer in order to recognize the intent and provide correspond answer during classification

6. item_list folder
- this file contain the product sold in this sytem.
- it will try to match the item with extracted keywrod from user message to return the item.

7. model folder
- this folder contain 4 different file to create the database table in mongodb connected.<br />
    - a) purchase.js -> purchase table that store the information of purchase action completed by the customer

    - b) refund_ticket.js -> refund table that store the information about the refund details

    - c) user.js -> store the information for the registered admin

    - d) userMessage.js -> store all message with several details such as time, response time etc for further action

- **the table will automatically created if there is no such table in the databae.**

8. public folder
- this folder contain the css, images, and js files used by the web pages.

- js folder contain 3 significant file which contain the jquery function for several action:
    - a) chat_history.js
        - this file contain the function that allow the human operator to review the chat history of all use.

    - b) operator.js
        - this file contain the function to show, sent, and receive message from customer or notificaiotn.

    - c) customer.js
        - this file contain the function to show, sent, and receive message from the human operator.

9. router folder
    - a) appConstants.js
        - this file stored the general message to trigger the event<br />

    - b) chat_message.js
        - this file will help to retrieve and process the old message, username and save the converstion from the human operator.<br />

    - c) chatConnectionHandler.js
        - initialize the connection when the server start

    - d) customerConnectionHandler.js
        - handle and route the customer input message and send to main message component to process by chatbot and return response.
        - the new customer information will be sent to customerStore to save the details and a welcome event will send back to customer.

    - e) customerStore.js
        - this file will store the customer details that have been created such as customer id, customer name, agent type etc

    - f) messageRouter
        - the main router to process the message from user and human operator and send back to both customer ad human operator. It will send the message to process by chatbot and receive result to decide next action.

    - g) operatorConnectionHandler
        - handle and route the customer input message and send to main message component to process.
        - it also contain the event handler for operator side for several action that had been mentioned.

9. sentiment_analysis folder
- the user input message will be sent through the sentiment_analysis.js in order to calculate the sentiment score and return.

10. server folder<br />
- a) app.js
    - the main component to run the server to host all web pages created.

11. static folder
- this folder contain all of the web pages created for both customer and human operator to simulate a real-life customer service chatbot system

12. userIntentFlow folder
- this folder contain 4 file to handle several scenario for customer serivce chatbot.
- if the user is asking FAQ questions, the response will directly return back to message router

    - a) userIntent.js
        - this file will determine which scenario will be applied based on the predicted intent at the beginning stage.

    - b) userPurchaseFlow.js
        - contain the IF-THEN scripts to handle the purchase flow create in order to achieve it

    - c) userRefundFlow.js
        - contain the IF-THEN scripts to handle the refund flow create in order to achieve it

    - d) userTrackingFlow.js
        - contain the IF-THEN scripts to handle the tracking flow create in order to achieve it

13. model.nlp file
- the chatbot model that has been trained and will be load in chatbot.js to process customer messages.
