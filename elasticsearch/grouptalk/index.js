var elasticsearch = require("elasticsearch");

var elasticClient = new elasticsearch.Client({
  host: "localhost:9200",
  log: "info",
});

var indexName = "messageappgrouptalks";
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
        senderid: { type: "text" },
        content: { type: "text" },
        time: { type: "keyword" },
        groupid: { type: "text" },
        filepath: { type: "keyword" },
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
      senderid: document.senderid,
      content: document.content,
      time: document.time,
      groupid: document.groupid,
    },
  });
}
exports.addDocument = addDocument;

function search(input, content) {
  return elasticClient.search({
    index: indexName,
    type: typeName,
    body: {
      query: {
        bool: {
          must: [
            {
              match: {
                groupid: {
                  query: input,
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
