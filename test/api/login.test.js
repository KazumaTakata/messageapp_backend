const axios = require("axios");
let functions = require("../../db/database");
var mongo = require("mongodb");
const home_url = "http://localhost:8181";

const user1 = { name: "sample_user1", pass: "sample_password1" };
const user2 = { name: "sample_user2", pass: "sample_password2" };
const user3 = { name: "sample_user3", pass: "sample_password3" };

beforeEach(async () => {
  try {
    await functions.destroyAll();
    await functions.insertUser(user1.name, user1.pass);
    await functions.insertUser(user2.name, user2.pass);
  } catch (err) {
    console.log(err);
  }
});

afterEach(async () => {
  await functions.destroyAll();
});

test("signup new user test", async () => {
  const url = home_url + "/api/login/";
  let result = await axios.post(url, {
    name: user3.name,
    password: user3.pass,
  });

  expect(result.status).toEqual(200);
  expect(result.data.login).toEqual(true);
  expect(result.data.name).toEqual(user3.name);
  expect(typeof result.data.token).toEqual("string");
});

test("login success", async () => {
  const url = home_url + "/api/login/";

  try {
    let result = await axios.post(url, {
      name: user2.name,
      password: user2.pass,
    });

    expect(result.status).toEqual(200);
    expect(result.data.login).toEqual(true);
    expect(result.data.name).toEqual(user2.name);
    expect(typeof result.data.token).toEqual("string");
  } catch (err) {
    console.log(err);
  }
});

test("login failed", async () => {
  const url = home_url + "/api/login/";

  try {
    let result = await axios.post(url, {
      name: user2.name,
      password: "dummy",
    });
  } catch (err) {
    expect(err.response.status).toEqual(400);
    expect(err.response.data.login).toEqual(false);
  }
});
