let functions = require("../../db/database");

beforeEach(async () => {
  await functions.destroyAll();
  await functions.insertUser("sample_user1", "sample_password1");
  await functions.insertUser("sample_user2", "sample_password2");
});

afterEach(async () => {
  await functions.destroyAll();
});

test("find feuser by id", done => {
  functions.insertUser("sample_user1", "sample_password1").then(result => {
    done();
  }, console.log);
});
