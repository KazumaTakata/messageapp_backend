var MongoClient = require("mongodb").MongoClient;
var mongo = require("mongodb");
var url = "mongodb://localhost:27017/";

var errHandler = function(err) {
  console.log(err);
};

let connectToDatabase = new Promise(function(resolve, reject) {
  MongoClient.connect(url, function(err, db) {
    if (err) {
      reject(err);
      db.close();
    } else {
      let dbo = db.db("swiftline");
      let collection = dbo.collection("users");
      resolve(collection);
      db.close();
    }
  });
});

function findUserById(id) {
  return new Promise((resolve, reject) => {
    connectToDatabase.then(conn => {
      conn.findOne({ _id: new mongo.ObjectID(id) }, function(err, result) {
        resolve(result);
      });
    }, reject);
  });
}

// findUserById("5b35d1b317f95911e0fad272").then(result => {
//   console.log(result);
// }, errHandler);

module.exports = { findUserById };
