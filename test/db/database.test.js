let functions = require("../../db/database");
var mongo = require("mongodb");

beforeEach(async () => {
  try {
    await functions.destroyAll();
    await functions.insertUser("sample_user1", "sample_password1");
    await functions.insertUser("sample_user2", "sample_password2");
  } catch (err) {
    console.log(err);
  }
});

afterEach(async () => {
  await functions.destroyAll();
});

test("find user by id", async () => {
  let name = "sample_user3";
  let password = "sample_password3";
  let useid = await functions.insertUser(name, password);
  let user = await functions.findUserById(useid);
  expect(user._id.toString()).toEqual(useid);
  expect(user.name).toEqual(name);
  expect(user.password).toEqual(password);
});

test("update", async () => {
  let name = "sample_user3";
  let password = "sample_password3";

  let userid = await functions.insertUser(name, password);

  let updateduserid = await functions.updateOneField(
    userid,
    "name",
    "updatedname"
  );

  let updateuser = await functions.findUserById(userid);

  expect(updateuser._id.toString()).toEqual(userid);
  expect(updateuser.name).toEqual("updatedname");
});

test("add friend test", async () => {
  let userid = await functions.insertUser("user1", "pass1");
  let userid2 = await functions.insertUser("user2", "pass2");

  let result = await functions.addFriend(userid, userid2);

  let user = await functions.findUserById(userid);

  expect(user.friendIds[0].toString()).toEqual(userid2);
  expect(user.friendIds.length).toEqual(1);
});

test("find user by name", async () => {
  let userid = await functions.insertUser("user1", "pass1");
  let userid2 = await functions.insertUser("user2", "pass2");

  let user = await functions.findUserByName("user1");
  expect(user._id.toString()).toEqual(userid);
});

test("find users by ids", async () => {
  let userid = await functions.insertUser("user1", "pass1");
  let userid2 = await functions.insertUser("user2", "pass2");
  let userid3 = await functions.insertUser("user3", "pass3");

  let ids = [new mongo.ObjectID(userid), new mongo.ObjectID(userid2)];

  let users = await functions.findUsersById(ids);

  expect(users[0]._id.toString()).toEqual(userid);
  expect(users[1]._id.toString()).toEqual(userid2);
});

test("insert chat ", async () => {
  let userid = await functions.insertUser("user1", "pass1");
  let userid2 = await functions.insertUser("user2", "pass2");

  let result = await functions.insertTalk(userid, "sample content");
  let result2 = await functions.insertTalk(userid, "sample content2");

  let user = await functions.findUserById(userid);

  expect(user.talks[0]).toEqual("sample content");
  expect(user.talks[1]).toEqual("sample content2");
});

test("get stored talk", async () => {
  let userid = await functions.insertUser("user1", "pass1");
  let userid2 = await functions.insertUser("user2", "pass2");

  let result = await functions.insertTalk(userid, "sample content");
  let result2 = await functions.insertTalk(userid, "sample content2");

  let talks = await functions.getStoredTalk(userid);
  expect(talks[0]).toEqual("sample content");
  let talks2 = await functions.getStoredTalk(userid);
  expect(talks2.length).toEqual(0);
});
