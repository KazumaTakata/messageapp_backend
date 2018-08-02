let functions = require("../../db/database");

test("find user by id", done => {
  expect(
    functions.findUserById("5b35d1b317f95911e0fad272").then(result => {
      done();
    })
  );
});
