const fs = require('fs');
const swagger = JSON.parse(fs.readFileSync('swagger.json', 'utf8'));

const apiList = {};

if (swagger.paths) {
  for (const [path, methods] of Object.entries(swagger.paths)) {
    for (const [method, details] of Object.entries(methods)) {
      const tags = details.tags || ['Uncategorized'];
      const tag = tags[0];
      
      if (!apiList[tag]) {
        apiList[tag] = [];
      }
      
      apiList[tag].push({
        path,
        method: method.toUpperCase(),
        summary: details.summary || '',
        description: details.description || '',
        operationId: details.operationId || ''
      });
    }
  }
}

fs.writeFileSync('api_list.json', JSON.stringify(apiList, null, 2));
console.log('Successfully extracted API list to api_list.json');
