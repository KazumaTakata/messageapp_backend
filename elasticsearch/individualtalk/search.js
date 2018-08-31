var elastic = require(".");
elastic
  .search("5b8002e6c543c6afab2a56e3", "5b8002d6c543c6afab2a56e2", "I school")
  .then(e => console.log(e));
