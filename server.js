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

var uniqueArray = function(arrArg) {
  return arrArg.filter(function(elem, pos, arr) {
    return arr.indexOf(elem) == pos;
  });
};

wss.on("connection", function connection(ws) {
  console.log("connect");

  ws.on("close", async () => {
    console.log("closed");
    let key = Object.keys(socketPool).find(key => socketPool[key] === ws);
    delete socketPool[key];

    if (key != undefined) {
      let user = await database.findUserById(key);
      let friendids = user.friendIds;
      let groupids = user.groups;
      let allloginusers = Object.keys(socketPool);
      let loginusers = friendids.filter(id => {
        return allloginusers.includes(id.toString());
      });

      for (let i = 0; i < loginusers.length; i++) {
        socketPool[loginusers[i]].send(
          JSON.stringify({
            type: "logout",
            logoutuserid: key,
          })
        );
      }

      let groupids_obj = groupids.map(id => new mongo.ObjectID(id));
      let groups = await database.getGroup(groupids_obj);
      let groupmembers = groups.map(g => g.member);
      let groupmembers_flatten = [].concat(...groupmembers);
      let groupmembers_flatten_unique = uniqueArray(groupmembers_flatten);
      let logingroupusers = groupmembers_flatten_unique.filter(id => {
        return allloginusers.includes(id.toString());
      });

      for (let i = 0; i < logingroupusers.length; i++) {
        socketPool[logingroupusers[i]].send(
          JSON.stringify({
            type: "logoutgroup",
            logoutgroupuserid: key,
          })
        );
      }
    }
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
        let user = await database.findUserById(myId);
        let friendids = user.friendIds;
        let groupids = user.groups;
        let allloginusers = Object.keys(socketPool);
        let loginusers = friendids.filter(id => {
          return allloginusers.includes(id.toString());
        });
        let sentobj = { type: "loginuserlist", loginfriendids: loginusers };
        ws.send(JSON.stringify(sentobj));

        for (let i = 0; i < loginusers.length; i++) {
          socketPool[loginusers[i]].send(
            JSON.stringify({
              type: "newloginuser",
              loginuserid: myId,
            })
          );
        }

        let groupids_obj = groupids.map(id => new mongo.ObjectID(id));
        let groups = await database.getGroup(groupids_obj);
        let groupmembers = groups.map(g => g.member);
        let groupmembers_flatten = [].concat(...groupmembers);
        let groupmembers_flatten_unique = uniqueArray(groupmembers_flatten);
        console.log(uniqueArray(groupmembers_flatten_unique));
        let logingroupusers = groupmembers_flatten_unique.filter(id => {
          return allloginusers.includes(id.toString());
        });
        let sentobj2 = {
          type: "logingroupuserlist",
          logingroupfriendids: logingroupusers,
        };
        ws.send(JSON.stringify(sentobj2));

        for (let i = 0; i < logingroupusers.length; i++) {
          if (logingroupusers[i] != myId) {
            socketPool[logingroupusers[i]].send(
              JSON.stringify({
                type: "newlogingroupuser",
                logingroupuserid: myId,
              })
            );
          }
        }
      } else if (type == "grouptalk") {
        socketPool[myId] = ws;
        let group = await database.findGroupById(groupid);
        group.member.forEach(async member => {
          if (member != myId) {
            let socket = socketPool[member];
            if (socket != undefined) {
              try {
                let payload = {
                  type: "newgroupchat",
                  content,
                  id: myId,
                  groupid,
                  time,
                  chatindex,
                };
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
            let payload = {
              type: "newchat",
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
});
