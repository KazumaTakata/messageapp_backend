const axios = require("axios");
let functions = require("../../db/database");
var mongo = require("mongodb");
const home_url = "http://localhost:8181";

const user1 = { name: "sample_user1", pass: "sample_password1" };
const user2 = { name: "sample_user2", pass: "sample_password2" };
const user3 = { name: "sample_user3", pass: "sample_password3" };

let userid1;
let userid2;

beforeEach(async () => {
  try {
    await functions.destroyAll();
    userid1 = await functions.insertUser(user1.name, user1.pass);
    userid2 = await functions.insertUser(user2.name, user2.pass);
  } catch (err) {
    console.log(err);
  }
});

afterEach(async () => {
  await functions.destroyAll();
});

async function dummylogin() {
  const loginurl = home_url + "/api/login/";
  let result = await axios.post(loginurl, {
    name: user3.name,
    password: user3.pass,
  });
  return result;
}

test("test add friend", async () => {
  jest.setTimeout(300000);
  try {
    let result = await dummylogin();
    let user3id = result.data.id;
    let token = result.data.token;

    const addfriendurl = home_url + "/api/friend/add/" + userid1;

    let addfriendresult = await axios({
      method: "get",
      url: addfriendurl,
      headers: { "x-access-token": token },
    });

    const addfriendurl2 = home_url + "/api/friend/add/" + userid2;

    let addfriendresult2 = await axios({
      method: "get",
      url: addfriendurl2,
      headers: { "x-access-token": token },
    });

    let retrieveuser3 = await functions.findUserById(user3id);

    expect(retrieveuser3.friendIds[0].toString()).toEqual(userid1);
    expect(retrieveuser3.friendIds[1].toString()).toEqual(userid2);
    expect(retrieveuser3.friendIds.length).toEqual(2);

    let retrieveuser1 = await functions.findUserById(userid1);

    expect(retrieveuser1.friendIds[0].toString()).toEqual(user3id);
    expect().toEqual(userid2);
    expect(retrieveuser1.friendIds.length).toEqual(1);
  } catch (err) {}
});

test("test get friend list", async () => {
  jest.setTimeout(300000);
  let result = await dummylogin();
  let user3id = result.data.id;
  let token = result.data.token;

  const addfriendurl = home_url + "/api/friend/add/" + userid1;

  let addfriendresult = await axios({
    method: "get",
    url: addfriendurl,
    headers: { "x-access-token": token },
  });

  const addfriendurl2 = home_url + "/api/friend/add/" + userid2;

  let addfriendresult2 = await axios({
    method: "get",
    url: addfriendurl2,
    headers: { "x-access-token": token },
  });

  let friendurl = home_url + "/api/friend";

  let friendlist = await axios({
    method: "get",
    url: friendurl,
    headers: { "x-access-token": token },
  });

  expect(friendlist.data[0].name).toEqual(user1.name);
  expect(friendlist.data[1].name).toEqual(user2.name);
});

test("test find friend by name", async () => {
  jest.setTimeout(300000);
  let result = await dummylogin();
  let user3id = result.data.id;
  let token = result.data.token;

  const url = home_url + "/api/friend/" + user1.name;

  let searchfriendresult = await axios({
    method: "get",
    url: url,
    headers: { "x-access-token": token },
  });

  expect(searchfriendresult.data.id).toEqual(userid1);
});

test("insert talk", async () => {
  jest.setTimeout(300000);
  let result = await dummylogin();
  let user3id = result.data.id;
  let token = result.data.token;

  const addfriendurl = home_url + "/api/user/talks";

  try {
    let addtalkresult = await axios({
      method: "post",
      url: addfriendurl,
      data: { content: "sample_talk", friendid: userid1 },
      headers: { "x-access-token": token },
    });

    let retrieveuser1 = await functions.findUserById(userid1);
    expect(retrieveuser1.talks[0].content).toEqual("sample_talk");
    expect(retrieveuser1.talks.length).toEqual(1);
  } catch (err) {
    console.log(err);
  }
});

test("get talk", async () => {
  jest.setTimeout(300000);
  let result = await dummylogin();
  let user3id = result.data.id;
  let token = result.data.token;

  const url = home_url + "/api/user/talks";

  try {
    await functions.insertTalk(userid1, user3id, "sample_talk");

    let gettalkresult = await axios({
      method: "get",
      url: url,
      headers: { "x-access-token": token },
    });

    expect(gettalkresult[0].content).toEqual("sample_talk");
    expect(gettalkresult[0].friendid).toEqual(userid1);
    expect(gettalkresult[0].friendid).toEqual();
  } catch (err) {
    console.log(err);
  }
});
