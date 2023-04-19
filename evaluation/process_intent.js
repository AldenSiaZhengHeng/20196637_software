// This file is to analyse the chatbot response time and accuracy
const {convertArrayToCSV} = require('convert-array-to-csv');

let fs = require("fs")

let writeStream = fs.createWriteStream('csv/predicted_intent.csv')

const userMessages = require('../model/userMessage')
const connectDB = require('../db')

// store repsone time
var resp_time = []

connectDB();

async function search_intent(){
    var intent = []
    await userMessages.find({"message":{$exists:true},"agentMessage":{$exists:true},"intent":{$exists:true}}).then(result=>{
        for(i=0; i<result.length; i++){
            // console.log(result[i])
            if(result[i].intent != "None"){
                if(result[i].agentMessage.length > 0){
                    console.log(result[i].agentMessage.length > 0)
                    if(isNaN(result[i].message)){
                        var test;
                        console.log(result[i].message)
                        console.log(result[i].intent)
                        test = { input: result[i].message, label: result[i].intent }                   
                        intent.push(test)
                    }
                }

 
            }
        //     if(result[i].response_time!=undefined){
        //         if(result[i].response_time!=0){
        //             get_value = result[i].response_time.split(" ")
        //             resp_time.push(get_value[0])
        //             console.log(resp_time)
        //         }
        //     }
        }
        // console.log(JSON.stringify(intent[0]))
        // console.log("hello")
    })
    // new_intent = JSON.parse(intent)
    // console.log(new_intent)
    new_intent = JSON.stringify(intent)
    console.log(new_intent)

    writeStream.write(`intent \n`);
    for(i = 0; i<intent.length; i++){
        // console.log(intent[i])
        writeStream.write(JSON.stringify(intent[i]) + '\n')
    }
    // writeStream.write(intent.join(','))
}

search_intent();

