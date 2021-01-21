const { randomBytes } = require("crypto");
const { writeFileSync, existsSync, mkdirSync, readFileSync } = require("fs");
const { bold, red } = require("./src/colors.js");

if(!existsSync("./data"))
{
    mkdirSync("./data");
    mkdirSync("./data/errors");
    writeFileSync("./data/database.json", `{"secret":"${randomBytes(8).toString("hex")}","users":{}}`);
}

const { request } = require("./src/requests.js");

const { Server } = require("./src/server.js");
var server = new Server(readFileSync("server.key"), readFileSync("server.cert"));

server.on("request", request);

process.on("uncaughtException", error =>
{
    console.log(`${bold(red(`Error: ${error.stack}`))}`);
    writeFileSync(`./data/errors/error-${randomBytes(4).toString("hex")}.txt`, error.stack);
});
