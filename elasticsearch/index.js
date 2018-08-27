var elasticsearch = require("elasticsearch");

var elasticClient = new elasticsearch.Client({
  host: "localhost:9200",
  log: "info",
});

var indexName = "messageapp";
let typeName = "talks";

/**
 * Delete an existing index
 */
function deleteIndex() {
  return elasticClient.indices.delete({
    index: indexName,
  });
}
exports.deleteIndex = deleteIndex;

/**
 * create the index
 */
function initIndex() {
  return elasticClient.indices.create({
    index: indexName,
  });
}
exports.initIndex = initIndex;

/**
 * check if the index exists
 */
function indexExists() {
  return elasticClient.indices.exists({
    index: indexName,
  });
}
exports.indexExists = indexExists;

function initMapping() {
  return elasticClient.indices.putMapping({
    index: indexName,
    type: typeName,
    body: {
      properties: {
        userid: { type: "text" },
        friendid: { type: "text" },
        content: { type: "text" },
        which: { type: "boolean" },
        time: { type: "keyword" },
      },
    },
  });
}
exports.initMapping = initMapping;

function addDocument(document) {
  return elasticClient.index({
    index: indexName,
    type: typeName,
    body: {
      userid: document.userid,
      friendid: document.friendid,
      content: document.content,
      time: document.time,
      which: document.which,
    },
  });
}
exports.addDocument = addDocument;

function search(input, input2, content) {
  return elasticClient.search({
    index: indexName,
    type: typeName,
    body: {
      query: {
        bool: {
          must: [
            {
              match: {
                userid: {
                  query: input,
                },
              },
            },
            {
              match: {
                friendid: {
                  query: input2,
                },
              },
            },
            {
              match: {
                content: {
                  query: content,
                  fuzziness: 2,
                },
              },
            },
          ],
        },
      },
    },
  });
}
exports.search = search;
