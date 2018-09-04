var passport = require("passport");
var GithubStrategy = require("passport-github").Strategy;
let db = require("../db/database");

passport.use(
  new GithubStrategy(
    {
      clientID: process.env.clientID,
      clientSecret: process.env.clientSecret,
      callbackURL: "http://localhost:8081/auth/github/callback",
    },
    async function(accessToken, refreshToken, profile, done) {
      let github_id = profile.id;
      let name = profile.username;
      let user = await db.findUserByGithubid(github_id);
      if (user != null) {
      } else {
        await db.insertUser(name, null, github_id);
      }
      return done(null, profile);
    }
  )
);

module.exports = passport;
