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
        }
      );
    });
  });
}

function addFriend(myid, friendid) {
  return new Promise((resolve, reject) => {
    connectToDatabase("users").then(conn => {
      var o_id = new mongo.ObjectID(myid);
      let f_id = new mongo.ObjectID(friendid);

      conn.updateOne(
        { _id: f_id },
        {
          $push: { friendIds: o_id },
        },
        (err, result) => {
          if (err) {
            reject(err);
          }
          resolve(result);
        }
      );
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
      conn.findOne({ _id: { $in: ids } }, function(err, result) {
        resolve(result);
        conn.db.close();
      });
    }, reject);
  });
}

function insertUser(name, password) {
  let obj = {
    name: name,
    password: password,
    photourl: "http://localhost:8181/img/defaultprofile.png",
    friendIds: [],
    talks: [],
    backgroundurl: "http://localhost:8181/img/rocco-caruso-722282-unsplash.jpg",
  };

  return new Promise((resolve, reject) => {
    connectToDatabase("users").then(conn => {
      conn.insertOne(obj, function(err, result) {
        if (err) {
          reject(err);
        }
        console.log("1 document inserted");
        resolve(result);
        conn.db.close();
      });
    });
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
    });
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

// findUserById("5b35d1b317f95911e0fad272").then(result => {
//   console.log(result);
// }, errHandler);

module.exports = {
  findUserById,
  findUsersById,
  insertUser,
  destroyAll,
  findUserByName,
  addFriend,
  getStoredTalk,
  updateOneField,
};
