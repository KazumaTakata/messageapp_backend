var MongoClient = require("mongodb").MongoClient;
var mongo = require("mongodb");
var url = "mongodb://localhost:8899/";

var errHandler = function(err) {
  console.log(err);
};

let connectToDatabase = function(Cname) {
  return new Promise(function(resolve, reject) {
    MongoClient.connect(url, function(err, db) {
      if (err) {
        reject(err);
      } else {
        let dbo = db.db("swiftline");
        let collection = dbo.collection(Cname);
        collection.db = db;
        resolve(collection);
      }
    });
  });
};

function findUserById(id) {
  return new Promise((resolve, reject) => {
    connectToDatabase("users").then(conn => {
      conn.findOne({ _id: new mongo.ObjectID(id) }, function(err, result) {
        if (err) {
          reject(err);
        }
        resolve(result);
        conn.db.close();
      });
    }, reject);
  });
}

function updateOneField(id, fieldname, fieldvalue) {
  return new Promise((resolve, reject) => {
    connectToDatabase("users").then(conn => {
      let updateData = {};
      updateData[fieldname] = fieldvalue;
      conn.updateOne(
        { _id: new mongo.ObjectID(id) },
        {
          $set: updateData,
        },
        (err, result) => {
          if (err) {
            reject(err);
          }
          resolve(result);
          conn.db.close();
        }
      );
    });
  });
}

function addFriend(myid, friendid) {
  return new Promise((resolve, reject) => {
    connectToDatabase("users").then(async conn => {
      var o_id = new mongo.ObjectID(myid);
      let f_id = new mongo.ObjectID(friendid);

      let user = await findUserById(myid);
      let friendids = user.friendIds.map(id => id.toHexString());

      if (friendids.indexOf(f_id.toHexString()) > -1) {
        resolve();
      } else {
        conn.updateOne(
          { _id: o_id },
          {
            $push: { friendIds: f_id },
          },
          (err, result) => {
            if (err) {
              reject(err);
            }
            resolve(result);
          }
        );
      }
    }, reject);
  });
}

function findUserByName(name) {
  return new Promise((resolve, reject) => {
    connectToDatabase("users").then(conn => {
      conn.findOne({ name: name }, function(err, result) {
        resolve(result);
        conn.db.close();
      });
    }, reject);
  });
}

function findUsersById(ids) {
  return new Promise((resolve, reject) => {
    connectToDatabase("users").then(conn => {
      conn.find({ _id: { $in: ids } }).toArray((err, result) => {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
    }, reject);
  });
}

function insertUser(name, password) {
  let obj = {
    name: name,
    password: password,
    photourl: "http://localhost:8181/img/defaultprofile.jpg",
    friendIds: [],
    talks: [],
    talksall: [],
    backgroundurl: "http://localhost:8181/img/rocco-caruso-722282-unsplash.jpg",
  };

  return new Promise((resolve, reject) => {
    connectToDatabase("users").then(conn => {
      conn.insertOne(obj, function(err, result) {
        if (err) {
          reject(err);
        }
        console.log("1 document inserted");
        resolve(result.insertedId.toString());
        conn.db.close();
      });
    }, reject);
  });
}

function destroyAll() {
  return new Promise((resolve, reject) => {
    connectToDatabase("users").then(conn => {
      conn.deleteMany({}, function(err, result) {
        if (err) {
          reject(err);
        }
        console.log("delete all");
        resolve(result);
        conn.db.close();
      });
    }, reject);
  });
}

function getStoredTalk(id) {
  return new Promise((resolve, reject) => {
    connectToDatabase("users").then(conn => {
      conn.findOne({ _id: new mongo.ObjectID(id) }, function(err, result) {
        if (err) {
          reject(err);
        }
        resolve(result.talks);
        conn.updateOne(
          { _id: new mongo.ObjectID(id) },
          { $set: { talks: [] } }
        );
      });
    });
  });
}

function insertTalk(senderid, recieverid, chatcontent) {
  return new Promise((resolve, reject) => {
    connectToDatabase("users").then(conn => {
      conn.updateOne(
        { _id: new mongo.ObjectID(recieverid) },
        { $push: { talks: { content: chatcontent, friendid: senderid } } },
        (err, result) => {
          if (err) {
            reject(err);
          }
          resolve(result);
        }
      );
    });
  });
}

function insertTalkAll(userid1, userid2, chatcontent, which) {
  return new Promise((resolve, reject) => {
    connectToDatabase("users").then(conn => {
      conn.updateOne(
        { _id: new mongo.ObjectID(userid2) },
        {
          $push: {
            talksall: { content: chatcontent, friendid: userid1, which: which },
          },
        },
        (err, result) => {
          if (err) {
            reject(err);
          }
          resolve(result);
        }
      );
    });
  });
}

function getfriendTalk(senderid, friendid) {
  return new Promise((resolve, reject) => {
    connectToDatabase("users").then(conn => {
      conn.findOne({ _id: new mongo.ObjectID(senderid) }, (err, result) => {
        if (err) {
          reject(err);
        }
        let specifictalks = result.talksall.filter(
          talk => talk.friendid == friendid
        );
        resolve(specifictalks);
      });
    });
  });
}

function insertFeed(id, feedcontent, photourl) {
  let insertobj = {
    id,
    feedcontent,
    photourl,
  };
  return new Promise((resolve, reject) => {
    connectToDatabase("feeds").then(conn => {
      conn.insertOne(insertobj, (err, result) => {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
    }, reject);
  });
}

function getFeed(userids) {
  return new Promise((resolve, reject) => {
    connectToDatabase("feeds").then(conn => {
      conn.find({ userId: { $in: userids } }).toArray((err, result) => {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
    }, reject);
  });
}

module.exports = {
  findUserById,
  findUsersById,
  insertUser,
  destroyAll,
  findUserByName,
  addFriend,
  getStoredTalk,
  updateOneField,
  getFeed,
  insertFeed,
  insertTalk,
  insertTalkAll,
  getfriendTalk,
};
