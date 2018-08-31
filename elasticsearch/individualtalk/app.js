var elastic = require(".");
elastic
  .indexExists()
  .then(function(exists) {
    if (exists) {
      return elastic.deleteIndex();
    }
  })
  .then(() => {
    elastic.initIndex().then(elastic.initMapping);
  });
