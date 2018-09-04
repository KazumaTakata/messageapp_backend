var MongoClient = require("mongodb").MongoClient;
var mongo = require("mongodb");
var url = "mongodb://localhost:27017/";
var jwt = require("jsonwebtoken");
var express = require("express");
var verifyToken = require("../middleware/verifyToken");
var multer = require("multer");
var db = require("../db/database");
var config = require("../config");
var elastic = require("../elasticsearch/individualtalk");
var elasticgroup = require("../elasticsearch/grouptalk");
var router = express.Router();

var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "static/img");
  },
  filename: function(req, file, cb) {
    let filenamelist = file.originalname.split(".");
    let filename =
      filenamelist[0] +
      `-${Date.now()}.` +
      filenamelist[filenamelist.length - 1];
    cb(null, filename);
  },
});

const upload = multer({
  storage,
});

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
    let user = await db.addFriend(req.userId, friendId);
    let user2 = await db.addFriend(friendId, req.userId);
    if (user != null) {
      res.send(200);
    } else {
      res.send(400);
    }
  } catch (err) {
    res.send(500);
  }
});

router.get("/user/talks", verifyToken, async (req, res) => {
  let talks = await db.getStoredTalk(req.userId);
  res.send(talks);
});

router.post(
  "/user/talks/file",
  verifyToken,
  upload.single("file"),
  async (req, res) => {
    let filepath = req.file.filename;
    res.send({ filepath: `http://localhost:8181/img/${filepath}` });
  }
);

router.get("/user/talks/:friendId", verifyToken, async (req, res) => {
  let friendId = req.params.friendId;
  let talks = await db.getfriendTalk(req.userId, friendId);
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

router.get("/user/myState/", verifyToken, async (req, res) => {
  try {
    let user = await db.findUserById(req.userId);
    let sendobj = {
      name: user.name,
      photourl: user.photourl,
      id: user._id.toString(),
    };
    res.status(200).send(sendobj);
  } catch (err) {
    res.send(400);
  }
});

router.post("/user/login/", async (req, res) => {
  let name = req.body.name;
  let pass = req.body.password;
  let loginorsignup = req.body.loginorsignup;

  if (loginorsignup == "signup") {
    let someuser = await db.findUserByName(name);
    if (someuser == null) {
      let newuserid = await db.insertUser(name, pass);
      let token = jwt.sign({ id: newuserid }, config.secret, {
        expiresIn: 86400, // expires in 24 hours
      });

      res.status(200).send({
        login: true,
        token: token,
        id: newuserid,
        name: name,
        photourl: "http://localhost:8181/img/defaultprofile.jpg",
      });
    } else {
      res.send(400);
    }
  } else {
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
          photourl: someuser.photourl,
        });
      } else {
        res.status(400).send({ login: false });
      }
    } else {
      res.status(400).send({ login: false });
    }
  }
});

router.get("/user/profile", verifyToken, async (req, res) => {
  try {
    let user = await db.findUserById(req.userId);
    let sendobj = { name: user.name, photourl: user.photourl };
    res.status(200).send(sendobj);
  } catch (err) {
    res.send(400);
  }
});

router.post(
  "/user/profile/photo",
  upload.single("image"),
  verifyToken,
  async (req, res) => {
    let photourl = `http://localhost:8181/img/${req.file.filename}`;
    try {
      await db.updateOneField(req.userId, "photourl", photourl);
      res.send({ photourl });
    } catch (err) {
      res.send(500);
    }
  }
);

router.post(
  "/video",
  upload.array("video", 2),
  verifyToken,
  async (req, res) => {
    let video_local = "";
    let video_remote = "";
    let videourl = req.files.map(f => {
      if (f.originalname == "local") {
        video_local = `http://localhost:8181/img/${f.filename}`;
      } else {
        video_remote = `http://localhost:8181/img/${f.filename}`;
      }
    });
    try {
      await db.insertVideo(
        req.userId,
        req.body.friendid,
        video_local,
        video_remote,
        req.body.time,
        req.body.textcontent
      );
      res.send(200);
    } catch (err) {
      res.send(500);
    }
  }
);

router.get("/video/:friendid", verifyToken, async (req, res) => {
  let friendid = req.params.friendid;

  try {
    let result = await db.getfriendVideo(req.userId, friendid);
    res.send(result);
  } catch (err) {
    console.log(err);
    res.send(500);
  }
});

router.post("/user/profile/name", verifyToken, async (req, res) => {
  let newname = req.body.name;
  let result = await db.findUserByName(newname);
  if (result == null) {
    let udpateresult = await db.updateOneField(req.userId, "name", newname);
    res.send(200);
  } else {
    res.send(400);
  }
});

router.post(
  "/user/feed",
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

router.get("/user/feed", verifyToken, async (req, res) => {
  try {
    let user = await db.findUserById(req.userId);
    let rawfriendsIds = user.friendIds.map(id => id.toString());
    rawfriendsIds.push(req.userId);
    let feeds = await db.getFeed(rawfriendsIds);
    res.send(feeds);
  } catch (err) {
    res.send(500);
  }
});

router.get(
  "/elastic/talk/:friendid/:content",
  verifyToken,
  async (req, res) => {
    let friendId = req.params.friendid;
    let content = req.params.content;
    try {
      let result = await elastic.search(req.userId, friendId, content);
      console.log(result.hits.hits);
      let sendobj = result.hits.hits.map(result => {
        return result._source;
      });
      res.status(200).send(sendobj);
    } catch (err) {
      res.send(500);
    }
  }
);

router.get(
  "/elastic/talkgroup/:groupid/:content",
  verifyToken,
  async (req, res) => {
    let groupid = req.params.groupid;
    let content = req.params.content;
    try {
      let result = await elasticgroup.search(groupid, content);
      console.log(result.hits.hits);
      let sendobj = result.hits.hits.map(result => {
        return result._source;
      });
      res.status(200).send(sendobj);
    } catch (err) {
      res.send(500);
    }
  }
);

router.post("/group", verifyToken, async (req, res) => {
  let groupname = req.body.groupname;
  let groupdescription = req.body.groupdescription;

  try {
    result = await db.createGroup(groupname, groupdescription, req.userId);
    let groupid = result.insertedId.toHexString();
    await db.insertGroupToUser(req.userId, groupid);
    await db.insertToGroup(req.userId, groupid);
    res.send({ groupid: groupid });
  } catch (err) {
    res.send(500);
  }
});

router.get("/group", verifyToken, async (req, res) => {
  try {
    let user = await db.findUserById(req.userId);
    let groupids = user.groups.map(id => {
      return new mongo.ObjectID(id);
    });
    let groups = await db.getGroup(groupids);
    res.send(groups);
  } catch (err) {
    res.send(500);
  }
});

router.get("/group/talk/:groupid", verifyToken, async (req, res) => {
  let groupid = req.params.groupid;
  try {
    let result = await db.getGroupTalks(groupid);
    res.send(result);
  } catch (err) {
    console.log(err);
    res.send(500);
  }
});

router.get("/group/:groupname", verifyToken, async (req, res) => {
  let groupname = req.params.groupname;
  try {
    let result = await db.findGroupByName(groupname);
    res.send({ id: result._id, name: result.groupname });
  } catch (err) {
    console.log(err);
    res.send(500);
  }
});

router.get("/group/member/:groupid", verifyToken, async (req, res) => {
  let groupid = req.params.groupid;
  try {
    let result = await db.getGroupMembers(groupid);
    let sendobj = result.map(m => {
      return { name: m.name, id: m._id, photourl: m.photourl };
    });
    res.send(sendobj);
  } catch (err) {
    console.log(err);
    res.send(500);
  }
});

router.put("/group/", verifyToken, async (req, res) => {
  let groupid = req.body.groupid;
  try {
    let result = await db.findGroupById(groupid);
    if (!result.member.includes(req.userId)) {
      await db.insertToGroup(req.userId, groupid);
      await db.insertGroupToUser(req.userId, groupid);
      res.send(200);
    } else {
      res.send(400);
    }
  } catch (err) {
    console.log(err);
    res.send(500);
  }
});

router.post("/group/talk/star", verifyToken, async (req, res) => {
  let groupid = req.body.groupid;
  let chatindex = req.body.chatindex;

  try {
    let result = await db.insertStarToGroup(groupid, Number(chatindex));
    res.send(200);
  } catch (err) {
    console.log(err);
    res.send(500);
  }
});

module.exports = router;
