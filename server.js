const WebSocket = require("ws");
var jwt = require("jsonwebtoken");
var MongoClient = require("mongodb").MongoClient;
var mongo = require("mongodb");
let database = require("./db/database");
var config = require("./config");
var elastic = require("./elasticsearch/index");

const wss = new WebSocket.Server({ port: 8084 });
let socketPool = {};

wss.on("connection", function connection(ws) {
  console.log("connect");

  ws.on("close", function close() {
    console.log("closed");
    let key = Object.keys(socketPool).find(key => socketPool[key] === this);
    delete socketPool[key];
  });

  ws.on("message", function incoming(message) {
    console.log(message);
    let token = JSON.parse(message.toString()).myId;
    let friendId = JSON.parse(message.toString()).friendId;
    let content = JSON.parse(message.toString()).content;
    let time = JSON.parse(message.toString()).time;

    let ping = JSON.parse(message.toString()).ping;

    jwt.verify(token, config.secret, async function(err, decoded) {
      let myId = decoded.id;

      if (ping == "hey") {
        socketPool[myId] = ws;
      } else {
        socketPool[myId] = ws;
        console.log("received: %s", message);
        // wss.clients.forEach( (client) => {
        //     client.send(message)
        // });
        if (socketPool[friendId] != undefined) {
          try {
            let payload = {
              content: content,
              id: myId,
              time: time,
            };
            socketPool[friendId].send(JSON.stringify(payload));
          } catch (e) {
            console.log(e);
          }
        } else {
          await database.insertTalk(myId, friendId, content, time);
        }
        await database.insertTalkAll(myId, friendId, content, time, 1);
        await database.insertTalkAll(friendId, myId, content, time, 0);

        let insertobj = {
          userid: myId,
          friendid: friendId,
          content: content,
          time: time,
          which: true,
        };
        await elastic.addDocument(insertobj);
        let insertobj2 = {
          userid: friendId,
          friendid: myId,
          content: content,
          time: time,
          which: false,
        };
        await elastic.addDocument(insertobj2);
      }
    });
  });
  //   ws.send('something');
});
