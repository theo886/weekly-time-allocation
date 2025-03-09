const { CosmosClient } = require("@azure/cosmos");

// Initialize Cosmos client
const endpoint = process.env.COSMOSDB_ENDPOINT;
const key = process.env.COSMOSDB_KEY;
const databaseName = process.env.COSMOSDB_DATABASE || "Timesheets";
const containerName = process.env.COSMOSDB_CONTAINER || "TimeAllocation";

let client = null;

function getClient() {
  if (!client) {
    if (!endpoint || !key) {
      throw new Error("Cosmos DB connection information is missing. Please check your environment variables.");
    }
    client = new CosmosClient({ endpoint, key });
  }
  return client;
}

async function getContainer() {
  const client = getClient();
  const database = client.database(databaseName);
  return database.container(containerName);
}

async function queryItems(query, parameters) {
  const container = await getContainer();
  const { resources } = await container.items
    .query({ query, parameters })
    .fetchAll();
  return resources;
}

async function getItem(id, partitionKey) {
  const container = await getContainer();
  const { resource } = await container.item(id, partitionKey).read();
  return resource;
}

async function createItem(item) {
  const container = await getContainer();
  const { resource } = await container.items.create(item);
  return resource;
}

async function replaceItem(id, partitionKey, item) {
  const container = await getContainer();
  const { resource } = await container.item(id, partitionKey).replace(item);
  return resource;
}

async function deleteItem(id, partitionKey) {
  const container = await getContainer();
  await container.item(id, partitionKey).delete();
}

module.exports = {
  getClient,
  getContainer,
  queryItems,
  getItem,
  createItem,
  replaceItem,
  deleteItem,
  databaseName,
  containerName
};