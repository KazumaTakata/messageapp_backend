var elasticsearch = require("elasticsearch");

var elasticClient = new elasticsearch.Client({
  host: "localhost:9200",
  log: "info",
});

var indexName = "messageapptalk";
let typeName = "talk";

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
