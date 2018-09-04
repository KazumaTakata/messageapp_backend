var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var router = require("./router/router");
var callbackrouter = require("./router/router2");
var cors = require("cors");
const config = require("./config/index");

app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 1000000,
  })
);

var passport = require("./passport");

app.use(passport.initialize());

app.use(bodyParser.json({ limit: "50mb", extended: true }));
app.use(express.static("static"));
app.use(cors());

var port = process.env.PORT || config.server_port;

app.use("/api", router);
app.use("/", callbackrouter);

app.listen(port);
