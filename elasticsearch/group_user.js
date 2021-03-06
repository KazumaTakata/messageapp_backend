var elasticsearch = require("elasticsearch");

var elasticClient = new elasticsearch.Client({
  host: "localhost:9200",
  log: "info",
});

var indexName = "messageappgroup";
let typeName = "group";

function search(name) {
  return elasticClient.search({
    index: indexName,
    type: typeName,
    body: {
      query: {
        bool: {
          must: [
            {
              match: {
                name: {
                  query: name,
                  fuzziness: 1,
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
