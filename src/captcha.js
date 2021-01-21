const { randomBytes, createHmac } = require("crypto");
const font = require("./json/captcha.json");
const letters = Object.keys(font);

var solved = new Set();

var verifyCaptcha = (id, timestamp, solution, signature, secret) =>
{
    if(createHmac("sha256", secret).update(`${id}${timestamp}${solution}`).digest("hex") !== signature)
    {
        return "Try again.";
    }

    if(timestamp + 60000 < Date.now())
    {
        return "This captcha has expired.";
    }

    if(solved.has(id))
    {
        return "This captcha has been already solved.";
    }

    solved.add(id);

    setTimeout(() =>
    {
        solved.delete(id);
    }, timestamp + 60000 - Date.now());

    return true;
};

var createCaptcha = (length, secret) =>
{
    let text = "";
    let position = -10;

    var output = [];

    while(length--)
    {
        var letter = letters[Math.floor(Math.random() * letters.length)];
        text += letter;

        let angle = Math.random() * 0.6 - 0.3;
        let sinus = Math.sin(angle);
        let cosinus = Math.cos(angle);
        let min = 64;
        let max = 0;

        for(const path of font[letter])
        {
            for(var index = 0; index < path.length; index++)
            {
                if(typeof path[index] === "number")
                {
                    let x = Math.round((path[index] * cosinus - (path[index + 1] - 32) * sinus) * 10) / 10;

                    min = Math.min(min, x);
                    max = Math.max(max, x);

                    index++;
                }
            }
        }

        var middle = position + (max - min) / 2;

        for(const path of font[letter])
        {
            var current = "";

            for(var index = 0; index < path.length; index++)
            {
                if(typeof path[index] === "number")
                {
                    var x = path[index] + position - min + 10 - middle;
                    var y = path[index + 1] - 32;
    
                    current += ` ${Math.round((x * cosinus - y * sinus + middle) * 10) / 10} ${Math.round((x * sinus + y * cosinus + 32) * 10) / 10}`;
                    index++;
                }
                else 
                {
                    current += ` ${path[index]}`;
                }
            }

            output.push(current.slice(1));
        }

        position += max - min + 10;
    }
    
    for(var index = output.length - 1; index > 0; index--)
    {
        var index2 = Math.floor(Math.random() * (index + 1));
        var value = output[index];
        output[index] = output[index2];
        output[index2] = value;
    }

    var result = {
        id: randomBytes(4).toString("hex"),
        timestamp: Date.now(),
        content: `<svg class="captcha-image" version="1.0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(position)} 64"><path fill="var(--text)" d="${output.join("")}"></path></svg>`
    };

    result.signature = createHmac("sha256", secret).update(`${result.id}${result.timestamp}${text}`).digest("hex");

    return result;
}

module.exports = { createCaptcha, verifyCaptcha };