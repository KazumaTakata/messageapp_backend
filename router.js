var MongoClient = require("mongodb").MongoClient;
var mongo = require("mongodb");
var url = "mongodb://localhost:27017/";
var jwt = require("jsonwebtoken");
var express = require("express");
var verifyToken = require("./middleware/verifyToken");
var multer = require("multer");
const upload = multer({ dest: "static/img" });
var db = require("./db/database");
var config = require("./config");

var router = express.Router();

router.get("/friend", verifyToken, async (req, res) => {
  try {
    let user = await db.findUserById(req.userId);
    let friendIds = user["friendIds"];
    let friends = await db.findUsersById(friendIds);
    let returndata = friends.map(doc => {
      return {
        name: doc["name"],
        photourl: doc["photourl"],
        id: doc._id.toString(),
        backgroundurl: doc["backgroundurl"],
      };
    });
    res.status(200).send(JSON.stringify(returndata));
  } catch (err) {
    res.send(500);
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
        id: result["_id"],
      };
      res.status(200).send(obj);
    }
  } catch (err) {
    console.log(err);
    res.send(500);
  }
});

router.get("/friend/add/:friendId", verifyToken, async (req, res) => {
  let friendId = req.params.friendId;

  try {
    await db.addFriend(req.userId, friendId);
    await db.addFriend(friendId, req.userId);
    res.send(200);
  } catch (err) {
    res.send(500);
  }
});

router.get("/user/talks", verifyToken, async (req, res) => {
  let talks = await db.getStoredTalk(req.userId);
  res.send(talks);
});

router.post("/user/talks", verifyToken, async (req, res) => {
  let content = req.body.content;
  let friendid = req.body.friendid;
  try {
    let result = await db.insertTalk(req.userId, friendid, content);
    res.send(200);
  } catch (err) {
    console.log(err);
    res.send(500);
  }
});

router.post("/user/login/", async (req, res) => {
  let name = req.body.name;
  let pass = req.body.password;

  let someuser = await db.findUserByName(name);
  if (someuser != null) {
    if (someuser.password == pass) {
      let token = jwt.sign({ id: someuser._id.toString() }, config.secret, {
        expiresIn: 86400, // expires in 24 hours
      });
      res.status(200).json({
        login: true,
        token: token,
        id: someuser._id.toString(),
        name: someuser.name,
      });
    } else {
      res.status(400).send({ login: false });
    }
  } else {
    let newuserid = await db.insertUser(name, pass);
    let token = jwt.sign({ id: newuserid }, config.secret, {
      expiresIn: 86400, // expires in 24 hours
    });

    res.status(200).send({
      login: true,
      token: token,
      id: newuserid,
      name: name,
    });
  }
});

router.get("user/profile", verifyToken, async (req, res) => {
  let myId = new mongo.ObjectID(decoded.id);
  try {
    let user = await db.findUserById(myId);
    let sendobj = { name: user.name, photourl: user.photourl };
    res.status(200).send(sendobj);
  } catch (err) {
    res.send(400);
  }
});

router.post(
  "user/profile/photo",
  upload.single("image"),
  verifyToken,
  async (req, res) => {
    let photourl = `http://localhost:8181/img/${req.file.filename}`;
    try {
      await db.updateOneField(req.userId, "photourl", photourl);
      res.send(200);
    } catch (err) {
      res.send(500);
    }
  }
);
router.post("user/profile/name", verifyToken, async (req, res) => {
  let newname = req.body.name;
  let result = await db.findUserByName(newname);
  if (result == null) {
    let udpateresult = await db.updateOneField(req.userId, "name", newuserid);
    res.send(200);
  } else {
    res.send(400);
  }
});

router.post(
  "user/feed",
  upload.single("image"),
  verifyToken,
  async (req, res) => {
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
  }
);

router.get("user/feed", verifyToken, async (req, res) => {
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
