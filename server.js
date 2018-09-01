const WebSocket = require("ws");
var jwt = require("jsonwebtoken");
var MongoClient = require("mongodb").MongoClient;
var mongo = require("mongodb");
let database = require("./db/database");
var config = require("./config");
var elastic = require("./elasticsearch/individualtalk");
var elasticgroup = require("./elasticsearch/grouptalk");

const wss = new WebSocket.Server({ port: 8084 });
let socketPool = {};

wss.on("connection", function connection(ws) {
  console.log("connect");

  ws.on("close", function close() {
    console.log("closed");
    let key = Object.keys(socketPool).find(key => socketPool[key] === this);
    delete socketPool[key];
  });

  ws.on("message", message => {
    console.log("received: %s", message);
    let token = JSON.parse(message.toString()).myId;

    jwt.verify(token, config.secret, async function(err, decoded) {
      let myId = decoded.id;
      let type = JSON.parse(message.toString()).type;
      let friendId = JSON.parse(message.toString()).friendId;
      let content = JSON.parse(message.toString()).content;
      let time = JSON.parse(message.toString()).time;
      let groupid = JSON.parse(message.toString()).groupid;
      let chatindex = JSON.parse(message.toString()).chatindex;

      if (type == "ping") {
        socketPool[myId] = ws;
      } else if (type == "grouptalk") {
        socketPool[myId] = ws;
        let group = await database.findGroupById(groupid);
        group.member.forEach(async member => {
          if (member != myId) {
            let socket = socketPool[member];
            if (socket != undefined) {
              try {
                let payload = { content, id: myId, groupid, time, chatindex };
                socket.send(JSON.stringify(payload));
              } catch (e) {
                console.log(e);
              }
            }
          }
        });
        let insertobj = { content, senderid: myId, time };
        if (chatindex != undefined) {
          await database.insertTalkToGroupAsResponce(
            groupid,
            chatindex,
            insertobj
          );
        } else {
          await database.insertTalkToGroup(groupid, insertobj);
          let elasticobj = { senderid: myId, time, content, groupid };
          await elasticgroup.addDocument(elasticobj);
        }
      } else if (type == "talk") {
        if (socketPool[friendId] != undefined) {
          try {
            let payload = { content: content, id: myId, time: time };
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
});
