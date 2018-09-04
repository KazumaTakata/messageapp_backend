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
var passport = require("passport");

router.get("/auth/github", passport.authenticate("github", { session: false }));

router.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/", session: false }),
  async function(req, res) {
    let github_id = req.user.id;
    let user = await db.findUserByGithubid(github_id);
    let userid = user._id;

    let token = jwt.sign({ id: userid.toHexString() }, config.secret, {
      expiresIn: 86400, // expires in 24 hours
    });
    const htmlWithEmbeddedJWT = `
<html>
  <script>
    // Save JWT to localStorage
    window.localStorage.setItem('JWT', '${token}');
    // Redirect browser to root of application
    window.location.href = '/';
  </script>
</html>
`;

    res.send(htmlWithEmbeddedJWT);
  }
);

module.exports = router;
