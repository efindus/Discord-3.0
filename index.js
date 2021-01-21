const { randomBytes } = require("crypto");
const { writeFileSync, existsSync, mkdirSync, readFileSync } = require("fs");

if(!existsSync("./data"))
{
    mkdirSync("./data");
    mkdirSync("./data/errors");
    writeFileSync("./data/database.json", `{"secret":"${randomBytes(8).toString("hex")}","users":{}}`);
}

const Server = require("./src/server.js");
var server = new Server(readFileSync("server.key"), readFileSync("server.cert"));

const { request } = require("./src/requests.js");
const { bold, red } = require("./src/colors.js");

server.on("request", request);

process.on("uncaughtException", error =>
{
    console.log(`${bold(red(`Error: ${error.stack}`))}`);
    writeFileSync(`./data/errors/error-${randomBytes(4).toString("hex")}.txt`, error.stack);
});