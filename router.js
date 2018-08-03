var MongoClient = require("mongodb").MongoClient;
var mongo = require("mongodb");
var url = "mongodb://localhost:27017/";
var jwt = require("jsonwebtoken");
var express = require("express");
var verifyToken = require("./middleware/verifyToken");
var multer = require("multer");
const upload = multer({ dest: "static/img" });
var db = require("./db/database");

var router = express.Router();


router.get("/friendslist", verifyToken, async (req, res) => {
  try {
    let user = await db.findUserById(req.userId);
    let friendIds = user["friendIds"];
    let friends = await db.findUsersById(friendIds);
    let returndata = friends.map(doc => {
      return {
        name: doc["name"],
        photourl: doc["photourl"],
        id: doc._id.toString(),
        backgroundurl: doc["backgroundurl"]
      };
    });
    res.status(200).send(returndata);
  } catch {
    res.status(500);
  }
});

router.get("/friend/:friendname", verifyToken, async (req, res) => {
  let friendname = req.params.friendname;

  try {
    let result = await db.findUserByName(friendname);
    if (result == null) {
      let obj = {};
      res.status(200).send(obj);
    } else {
      let obj = {
        name: result["name"],
        photourl: result["photourl"],
        id: result["_id"]
      };
      res.status(200).send(obj);
    }
  } catch (err) {
    console.log(err);
    res.status(500);
  }
});

router.get("/addfriend/:friendId", verifyToken, async (req, res) => {
  let friendId = req.params.friendId;

  let o_id = new mongo.ObjectID(req.userId);
  let f_id = new mongo.ObjectID(friendId);

  try {
    await db.updateOneField(f_id, "friendIds", o_id);
    await db.updateOneField(o_id, "friendIds", f_id);
    res.send(200);
  } catch (err) {
    res.send(500);
  }
});

router.get("/storedtalks", verifyToken, async (req, res) => {
  let talks = await db.getStoredTalk(req.userId);
  res.send(talks);
});

router.post("/login", async (req, res) => {
  let name = req.body.name;
  let pass = req.body.password;

  let obj = {
    name: name,
    password: pass,
    photourl: "http://localhost:8181/img/defaultprofile.png",
    friendIds: [],
    talks: [],
    backgroundurl: "http://localhost:8181/img/rocco-caruso-722282-unsplash.jpg"
  };

  let someuser = await db.findUserByName(name);
  if (someuser != null) {
    if (someuser.password == pass) {
      let token = jwt.sign({ id: result._id.toString() }, "mysecret", {
        expiresIn: 86400 // expires in 24 hours
      });
      res.status(200).json({
        login: true,
        token: token,
        id: someuser._id.toString(),
        name: someuser.name
      });
    } else {
      res.status(400).send({ login: false });
    }
  } else {
    let newuserid = await db.insertUser(obj);

    let token = jwt.sign({ id: result.insertedId.toString() }, "mysecret", {
      expiresIn: 86400 // expires in 24 hours
    });

    res.status(200).send({
      login: true,
      token: token,
      id: newuserid,
      name: name
    });
  }
});

router.get("/profile", verifyToken, async (req, res) => {
  let myId = new mongo.ObjectID(decoded.id);

  MongoClient.connect(
    url,
    function(err, db) {
      let dbo = db.db("swiftline");

      dbo
        .collection("users")
        .find({ _id: myId })
        .toArray((err, result) => {
          let sendobj = { name: result[0].name, photourl: result[0].photourl };
          res.json(sendobj);
        });
    }
  );
});

router.post(
  "/profile/photo",
  upload.single("image"),
  verifyToken,
  (req, res) => {
    let photourl = `http://localhost:8181/img/${req.file.filename}`;
    try {
       await db.updateOneField(req.userId, "photourl", photourl);
      res.send(200);
    } catch (err) {
      res.send(500);
    }
  }
);
router.post("/profile/name", verifyToken, async (req, res) => {
  let newname = req.body.name;
  let result = await db.findUserByName(newname)
  if (result == null) {
      let udpateresult = await db.updateOneField(req.userId, "name", newuserid )
      res.send(200);
    }else {
      res.send(400);
    }
});


router.post("/feed", upload.single("image"), verifyToken, async (req, res) => {
  let photourl = "";
  if (req.file != undefined) {
    photourl = `http://localhost:8181/img/${req.file.filename}`;
  }
  try {
    let result = await db.insertFeed(
      req.userId,
      req.body.feedcontent,
      photourl
    );
    res.send(200);
  } catch (err) {
    res.send(500);
  }
});

router.get("/feed", verifyToken, async (req, res) => {
  try {
    let user = await db.findUserById(req.userId);
    let rawfriendsIds = user.friendIds.map(id => id.toString());
    let feeds = await db.getFeed(rawfriendsIds);

    res.send(feeds);
  } catch (err) {
    res.send(500);
  }
});

module.exports = router;
