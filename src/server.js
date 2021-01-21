const EventEmitter = require("events");
const { URL } = require("url");
const { createServer, STATUS_CODES } = require("http");
const { createSecureServer } = require("http2");
const { green, blue, bold } = require("./colors.js");

var displayBytes = (bytes) =>
{
    if(bytes > 1024 * 1024)
    {
        return `${Math.round(bytes / 1024 / 1024 * 10 + Number.EPSILON) / 10} MB`;
    }
    else if(bytes > 1024)
    {
        return `${Math.round(bytes / 1024 * 10 + Number.EPSILON) / 10} kB`;
    }
    else
    {
        return `${bytes} B`;
    }
};

class Server extends EventEmitter
{
    /**
     * Launches new HTTP server.
     * @param {string} key Server key.
     * @param {string} cert Server cert.
     */
    constructor(key, cert)
    {
        super();

        createServer((request, response) =>
        {
            response.writeHead(301, { location: `https://${request.headers.host}${request.url}` });
            response.end();
        }).listen(80);

        var server = createSecureServer({
            key: key,
            cert: cert,
            allowHTTP1: true
        });

        server.on("request", (request, response) =>
        {
            var ip = request.socket.remoteAddress;
            var start = process.hrtime.bigint();

            response.on("finish", () =>
            {
                var end = process.hrtime.bigint();

                if(request.socket.bytesSent === undefined)
                {
                    request.socket.bytesSent = 0;
                    request.socket.bytesReceived = 0; 
                }

                var url = request.url;

                if(request.method.length + url.length > 25)
                {
                    url = `${url.slice(0, 22 - request.method.length)}...`;
                }

                while(request.method.length + url.length < 25)
                {
                    url += " ";
                }

                var userAgent = request.headers["user-agent"] || "unknown";

                if(userAgent.length > 90)
                {
                    userAgent = `${userAgent.slice(0, 87)}...`;
                }
                console.log(
                    `${bold(green(request.method))} ${bold(blue(url))} ` +
                    `${bold(green("Status:"))} ${bold(blue(`${response.statusCode} ${STATUS_CODES[response.statusCode]}`))} `+
                    `${bold(green("Time:"))} ${bold(blue(`${Math.round(Number(end - start) / 1000) / 1000} ms`))} ` +
                    `${bold(green("Received:"))} ${bold(blue(displayBytes(request.socket.bytesRead - request.socket.bytesReceived)))} ` +
                    `${bold(green("Sent:"))} ${bold(blue(displayBytes(request.socket.bytesWritten - request.socket.bytesSent)))} ` +
                    `${bold(green("IP:"))} ${bold(blue(ip))} ` +
                    `${bold(green("User-Agent:"))} ${bold(blue(userAgent))}`
                );

                request.socket.bytesSent = request.socket.bytesWritten;
                request.socket.bytesReceived = request.socket.bytesRead; 
            });

            var path = new URL(request.url, `https://${request.headers.host}`).pathname;
            path = path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;

            // TODO: use builtin nodejs funcitons
            
            var cookies = {};

            if(request.headers.cookie !== undefined)
            {
                request.headers.cookie.split("; ").forEach(cookie =>
                {
                    var index = cookie.indexOf("=");

                    if(index !== -1)
                    {
                        cookies[cookie.slice(0, index)] = cookie.slice(index + 1);
                    }
                    else
                    {
                        cookies[cookie] = "";
                    }
                });
            }

            var data = "";

            request.on("data", (buffer) =>
            {
                data += buffer.toString();
            });

            request.on("end", () =>
            {
                this.emit("request", request.method, path, cookies, data, response);
            });
        });

        server.listen(443);
    }
};

module.exports = Server;