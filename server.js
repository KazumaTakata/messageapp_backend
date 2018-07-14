const WebSocket = require('ws');
var jwt = require('jsonwebtoken');
var MongoClient = require('mongodb').MongoClient;
var mongo = require('mongodb');

var url = "mongodb://localhost:27017/";

const wss = new WebSocket.Server({ port: 8084 });
let socketPool = {}

wss.on('connection', function connection(ws) {
  console.log("connect")

  ws.on("close", function close(){
    console.log("closed")
    let key = Object.keys(socketPool).find(key => socketPool[key] === this);
    delete socketPool[key]
  })

  ws.on('message', function incoming(message) {

    let token = JSON.parse(message.toString()).myId
    let friendId = JSON.parse(message.toString()).friendId
    let content = JSON.parse(message.toString()).content

    let ping = JSON.parse(message.toString()).ping
    
    jwt.verify( token, "mysecret", function(err, decoded) {

      let myId = decoded.id

      if ( ping == "hey" ) {

        socketPool[myId] = ws 
      
      } else {
        socketPool[myId] = ws 
        console.log('received: %s', message);
        // wss.clients.forEach( (client) => {
        //     client.send(message)
        // });
        if (socketPool[friendId] != undefined){

          try{
            let payload = {content: content, id: myId}
            socketPool[friendId].send( JSON.stringify(payload) )
          } catch (e) {
            console.log(e)
          }

        
        } else {

          MongoClient.connect(url, function(err, db) {
            let dbo = db.db("swiftline")

            let f_id = new mongo.ObjectID(friendId)

            let payload = {content: content, id: myId}

            dbo.collection("users").updateOne({_id: f_id},{
              $push: {"talks": payload }
          })

        })    
        }


      }
      
    }
    
    )
  });
//   ws.send('something');
});


