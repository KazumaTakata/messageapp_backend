var elasticsearch = require("elasticsearch");

var elasticClient = new elasticsearch.Client({
  host: "localhost:9200",
  log: "info",
});

var indexName = "messageappgrouptalk";
let typeName = "talk";

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
