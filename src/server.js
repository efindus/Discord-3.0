const EventEmitter = require("events");
const { URL } = require("url");
const { createServer, STATUS_CODES } = require("http");
const { parse } = require("querystring");
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

        let server = createSecureServer({
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

                if(request.method.length + url.length > 30)
                {
                    url = `${url.slice(0, 27 - request.method.length)}...`;
                }

                while(request.method.length + url.length < 30)
                {
                    url += " ";
                }

                console.log(`${bold(green(request.method))} ${bold(blue(url))} ${bold(green(`(${Math.round(Number(end - start) / 1000) / 1000} ms)`))}`);

                request.socket.bytesSent = request.socket.bytesWritten;
                request.socket.bytesReceived = request.socket.bytesRead; 
            });

            var path = new URL(request.url, `https://${request.headers.host}`).pathname;
            path = path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;

            var data = "";

            request.on("data", (buffer) =>
            {
                data += buffer.toString();
            });

            request.on("end", () =>
            {
                this.emit("request", request.method, path, parse(request.headers.cookie || "", "; ", "="), data, response);
            });
        });

        server.listen(443);
    }
};

module.exports = Server;