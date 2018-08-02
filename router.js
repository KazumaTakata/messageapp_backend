var MongoClient = require("mongodb").MongoClient;
var mongo = require("mongodb");
var url = "mongodb://localhost:27017/";
var jwt = require("jsonwebtoken");
var express = require("express");

var multer = require("multer");
const upload = multer({ dest: "static/img" });
var db = require("./db/database");

var router = express.Router();

router.get("/", function(req, res) {
  res.send("hello");
});

router.get("/friendslist", (req, res) => {
  console.log("friendlist req");

  jwt.verify(req.headers["x-access-token"], "mysecret", function(err, decoded) {
    if (err)
      return res
        .status(500)
        .send({ auth: false, message: "Failed to authenticate token." });

    MongoClient.connect(url, function(err, db) {
      let dbo = db.db("swiftline");

      var o_id = new mongo.ObjectID(decoded["id"]);
      dbo.collection("users").findOne({ _id: o_id }, function(err, result) {
        console.log(result);
        let friendIds = result["friendIds"];

        dbo
          .collection("users")
          .find({ _id: { $in: friendIds } }, { name: 1 })
          .toArray((err, result) => {
            console.log(result);
            let returndata = result.map(doc => {
              return {
                name: doc["name"],
                photourl: doc["photourl"],
                id: doc._id.toString(),
                backgroundurl: doc["backgroundurl"],
              };
            });
            res.json(returndata);
          });
      });
    });
  });
});

router.get("/find/:friendname", (req, res) => {
  let friendname = req.params.friendname;
  jwt.verify(req.headers["x-access-token"], "mysecret", function(err, decoded) {
    if (err)
      return res
        .status(500)
        .send({ auth: false, message: "Failed to authenticate token." });
    MongoClient.connect(url, function(err, db) {
      let dbo = db.db("swiftline");
      dbo.collection("users").findOne({ name: friendname }, (err, result) => {
        if (result == null) {
          let obj = {};
          res.json(obj);
        } else {
          let obj = {
            name: result["name"],
            photourl: result["photourl"],
            id: result["_id"],
          };
          res.json(obj);
        }
      });
    });
  });
});

router.get("/addfriend/:friendId", (req, res) => {
  let friendId = req.params.friendId;

  jwt.verify(req.headers["x-access-token"], "mysecret", function(err, decoded) {
    if (err)
      return res
        .status(500)
        .send({ auth: false, message: "Failed to authenticate token." });

    MongoClient.connect(url, function(err, db) {
      let dbo = db.db("swiftline");

      var o_id = new mongo.ObjectID(decoded["id"]);
      let f_id = new mongo.ObjectID(friendId);

      dbo.collection("users").updateOne(
        { _id: f_id },
        {
          $push: { friendIds: o_id },
        }
      );

      dbo.collection("users").updateOne(
        { _id: o_id },
        {
          $push: { friendIds: f_id },
        }
      );

      res.json({ ok: "ok" });
    });
  });
});

router.get("/storedtalks", (req, res) => {
  jwt.verify(req.headers["x-access-token"], "mysecret", function(err, decoded) {
    let myId = new mongo.ObjectID(decoded.id);

    MongoClient.connect(url, function(err, db) {
      let dbo = db.db("swiftline");

      dbo
        .collection("users")
        .find({ _id: myId })
        .toArray((err, result) => {
          res.json(result[0].talks);

          dbo
            .collection("users")
            .updateOne({ _id: myId }, { $set: { talks: [] } });
        });
    });
  });
});

router.post("/login", (req, res) => {
  let name = req.body.name;
  let pass = req.body.password;

  let defaultfriendIds = [];
  let obj = {
    name: name,
    password: pass,
    photourl: "http://localhost:8181/img/defaultprofile.png",
    friendIds: defaultfriendIds,
    talks: [],
    backgroundurl: "http://localhost:8181/img/rocco-caruso-722282-unsplash.jpg",
  };

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    let dbo = db.db("swiftline");
    dbo.collection("users").findOne({ name: name }, function(err, result) {
      console.log(result);
      if (result == null) {
        dbo.collection("users").insertOne(obj, function(err, result) {
          if (err) throw err;

          let token = jwt.sign(
            { id: result.insertedId.toString() },
            "mysecret",
            {
              expiresIn: 86400, // expires in 24 hours
            }
          );

          console.log("1 document inserted");
          res.json({
            login: true,
            token: token,
            id: result.ops[0]._id.toString(),
            name: result.ops[0].name,
          });
          db.close();
        });
      } else {
        if (result.password == pass) {
          let token = jwt.sign({ id: result._id.toString() }, "mysecret", {
            expiresIn: 86400, // expires in 24 hours
          });
          res.json({
            login: true,
            token: token,
            id: result._id.toString(),
            name: result.name,
          });
        } else {
          res.json({ login: false });
        }
      }

      db.close();
    });
  });

  // res.json({login: true, userId: 1})
});

router.get("/profile", (req, res) => {
  jwt.verify(req.headers["x-access-token"], "mysecret", function(err, decoded) {
    let myId = new mongo.ObjectID(decoded.id);

    MongoClient.connect(url, function(err, db) {
      let dbo = db.db("swiftline");

      dbo
        .collection("users")
        .find({ _id: myId })
        .toArray((err, result) => {
          let sendobj = { name: result[0].name, photourl: result[0].photourl };
          res.json(sendobj);
        });
    });
  });
});

router.post("/profile/photo", upload.single("image"), (req, res) => {
  jwt.verify(req.headers["x-access-token"], "mysecret", function(err, decoded) {
    let myId = new mongo.ObjectID(decoded.id);
    console.log(req.file);
    let photourl = `http://localhost:8181/img/${req.file.filename}`;

    MongoClient.connect(url, function(err, db) {
      let dbo = db.db("swiftline");
      dbo.collection("users").updateOne(
        { _id: myId },
        {
          $set: { photourl: photourl },
        }
      );
      res.json({ ok: "ok" });
    });
  });
});

router.post("/profile/name", (req, res) => {
  jwt.verify(req.headers["x-access-token"], "mysecret", function(err, decoded) {
    let myId = new mongo.ObjectID(decoded.id);
    let newname = req.body.name;

    MongoClient.connect(url, function(err, db) {
      let dbo = db.db("swiftline");
      dbo.collection("users").findOne({ name: newname }, (err, result) => {
        if (result == null) {
          dbo.collection("users").updateOne(
            { _id: myId },
            {
              $set: { name: newname },
            }
          );
          res.json({ ok: "ok" });
        }
      });
    });
  });
});

router.post("/feed", upload.single("image"), (req, res) => {
  jwt.verify(req.headers["x-access-token"], "mysecret", function(err, decoded) {
    let myId = new mongo.ObjectID(decoded.id);
    console.log(req.file);
    let photourl = "";
    if (req.file != undefined) {
      photourl = `http://localhost:8181/img/${req.file.filename}`;
    }
    let insertobj = {
      userId: decoded.id,
      feedcontent: req.body.feedcontent,
      photourl: photourl,
    };

    MongoClient.connect(url, function(err, db) {
      let dbo = db.db("swiftline");

      dbo.collection("feeds").insertOne(insertobj, (req, result) => {
        res.json({ ok: "ok" });
      });
    });
  });
});

router.get("/feed", (req, res) => {
  jwt.verify(req.headers["x-access-token"], "mysecret", function(err, decoded) {
    let myId = new mongo.ObjectID(decoded.id);

    MongoClient.connect(url, function(err, db) {
      let dbo = db.db("swiftline");

      dbo.collection("users").findOne({ _id: myId }, (err, result) => {
        let rawfriendsIds = result.friendIds.map(id => id.toString());
        dbo
          .collection("feeds")
          .find({ userId: { $in: rawfriendsIds } })
          .toArray((err, result) => {
            res.json(result);
          });
      });
    });
  });
});

module.exports = router;
