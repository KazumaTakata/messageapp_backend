
var express    = require('express');        
var app        = express();                 
var bodyParser = require('body-parser');
var router     = require("./router")

app.use(bodyParser.urlencoded({limit:'50mb', extended: true, parameterLimit: 1000000}));
app.use(bodyParser.json({ limit:'50mb',extended: true }));
app.use(express.static('static'))

var port = process.env.PORT || 8181;       
         

// router.get('/', function(req, res) {
//     res.json({ message: 'hooray! welcome to our api!' });   
// });

app.use('/api', router);

app.listen(port);
