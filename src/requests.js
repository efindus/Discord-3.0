const { randomBytes, createHash, createHmac } = require("crypto");
const { createReadStream, existsSync, lstatSync } = require("fs");
const { createCaptcha, verifyCaptcha } = require("./captcha.js");

var Database = require("./database.js");
var database = new Database("./data/database.json");

var contentTypes = require("./json/contentTypes.json");


module.exports.request = (method, path, cookies, data, response) =>
{
    var user;

    if(cookies.session !== undefined && createHmac("sha256", database.data.secret).update(cookies.session).digest("hex") === cookies.signature)
    {
        var cookie = JSON.parse(cookies.session);

        if(Date.now() < new Date(cookie.expires).getTime())
        {
            user = cookie.username;
        }
    }

    // Main page

    if(path === "/")
    {
        if(user === undefined)
        {
            response.writeHead(303, { "Location": "/login" });
            response.end();
        }
        else
        {
            response.writeHead(200, { "Content-Type": "text/html" });
            createReadStream("./static/html/index.html").pipe(response);
        }

        return;
    }


    // Log in

    if(path == "/login")
    {
        if(user === undefined)
        {
            response.writeHead(200, { "Content-Type": "text/html" });
            createReadStream("./static/html/login.html").pipe(response);
        }
        else
        {
            response.writeHead(303, { "Location": "/" });
            response.end();
        }

        return;
    }

    // Register

    if(path === "/register")
    {
        if(user === undefined)
        {
            response.writeHead(200, { "Content-Type": "text/html" });
            createReadStream("./static/html/register.html").pipe(response);
        }
        else
        {
            response.writeHead(303, { "Location": "/" });
            response.end();
        }

        return;
    }

    // APIs

    if(method === "POST" && path === "/api/login")
    {
        var result = {};
        data = JSON.parse(data);

        if(typeof data.username !== "string" || database.data.users[data.username] === undefined)
        {
            result.type = "username";
            result.message = "Wrong username.";
        }
        else if(typeof data.password !== "string" || database.data.users[data.username].password !== createHash("sha256").update(database.data.users[data.username].salt + data.password).digest("hex"))
        {
            result.type = "password";
            result.message = "Wrong password.";
        }
        else
        {
            result.type = "success";
            
            var expires = new Date(data.expires);

            if(isNaN(expires.getTime()))
            {
                expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
            }

            var cookie = JSON.stringify({
                username: data.username,
                expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toUTCString()
            });

            var expiresString = data.remember === true ? `Expires=${expires.toUTCString()}; ` : ""; 
            
            response.setHeader("Set-Cookie", [
                `session=${cookie}; ${expiresString}Path=/`,
                `signature=${createHmac("sha256", database.data.secret).update(cookie).digest("hex")}; ${expiresString}Path=/`,
                `finished=${database.data.users[data.username].finished}; ${expiresString}Path=/`
            ]);
        }

        response.writeHead(200, { "Content-Type": "application/json" });
        response.write(JSON.stringify(result));
        response.end();

        return;
    }
    else if(method === "POST" && path === "/api/register")
    {
        var errors = [];
        data = JSON.parse(data);
        console.log(data);

        if(typeof data.username !== "string" || data.username.length < 3 || data.username.length > 24)
        {
            errors.push({ type: "username", message: "Username must be between 3 and 24 characters long." });
        }
        else if(database.data.users[data.username] !== undefined)
        {
            errors.push({ type: "username", message: "This username is already taken." });
        }
        else if(!/^[a-zA-Z0-9_]*$/.test(data.username))
        {
            errors.push({ type: "username", message: "Only letters, numbers and underscores are allowed." });
        }

        if(typeof data.password1 !== "string" || typeof data.password2 !== "string" || data.password1 !== data.password2)
        {
            errors.push({ type: "password", message: "Passwords don't match." });
        }
        else if(data.password1.length < 8)
        {
            errors.push({ type: "password", message: "Password must be at least 8 characters long." });
        }
        else if(data.password1.length > 64)
        {
            errors.push({ type: "password", message: "Password cannot be more than 64 characters long." });
        }

        let captchaResult = verifyCaptcha(data.captchaId, data.captchaTimestamp, data.captchaSolution, data.captchaSignature, database.data.secret);

        if(typeof captchaResult === "string")
        {
            errors.push({ type: "captcha", message: captchaResult });
        }
        
        if(errors.length === 0)
        {
            var salt = randomBytes(4).toString("hex");

            database.data.users[data.username] = {
                salt: salt,
                password: createHash("sha256").update(salt + data.password1).digest("hex"),
                nickname: "",
                color: 0,
                customProfilePicture: false,
                finished: false
            };

            database.save();
            var expires = new Date(data.expires);

            if(isNaN(expires.getTime()))
            {
                expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
            }

            var cookie = JSON.stringify({
                username: data.username,
                expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toUTCString()
            });

            response.setHeader("Set-Cookie", [
                `session=${cookie}; Expires=${expires.toUTCString()}; Path=/`,
                `signature=${createHmac("sha256", database.data.secret).update(cookie).digest("hex")}; Expires=${expires.toUTCString()}; Path=/`,
                `finished=false; Expires=${expires.toUTCString()}; Path=/`
            ]);
        }

        response.writeHead(200, { "Content-Type": "application/json" });
        response.write(JSON.stringify(errors));
        response.end();

        return;
    }
    else if(method === "POST" && path === "/api/captcha")
    {
        var result = createCaptcha(8, database.data.secret);

        response.writeHead(200, { "Content-Type": "application/json" });
        response.write(JSON.stringify(result));
        response.end();

        return;
    }
    
    // Static files

    if(path.startsWith("../") || path.startsWith("/html/") || !existsSync(`./static${path}`) || !lstatSync(`./static${path}`).isFile())
    {
        response.writeHead(404, { "Content-Type": "text/html" });
        createReadStream("./static/html/404.html").pipe(response);
        return;
    }

    response.writeHead(200, { "Content-Type": contentTypes[path.slice(path.lastIndexOf(".") + 1)] || "text/plain" });
    createReadStream(`./static${path}`).pipe(response);
}