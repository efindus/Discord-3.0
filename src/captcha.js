const { randomBytes, createHmac } = require("crypto");
const font = require("./json/captcha.json");
const letters = Object.keys(font);

var solved = new Set();

/**
 * Verifies if captcha was solved correctly.
 * @param {string} id - Unique captcha id.
 * @param {string} timestamp - Captcha creation timestamp.
 * @param {string} solution - Solution to test.
 * @param {string} signature - Captcha signature.
 * @param {string} secret - Secret that was used to sign the captcha.
 * @returns {string|boolean} Returns true if captcha was solved correctly. Else the error message is provided.
 */

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

/**
 * Captcha data
 * @typedef {object} CaptchaData
 * @property {string} id - Unique captcha id.
 * @property {number} timestamp - Captcha creation timestamp.
 * @property {string} signature - Captcha signature.
 * @property {string} content - Captcha content.
 */

/**
 * Creates a new captcha.
 * @param {number} length - The length of the captcha.
 * @param {string} secret - Secret key used to sign a captcha.
 * @returns {CaptchaData} Captcha data 
 */

var createCaptcha = (length, secret) =>
{
    let solution = "";
    let position = -10;
    let output = [];

    while(length--)
    {
        let letter = letters[Math.floor(Math.random() * letters.length)];
        solution += letter;

        let angle = Math.random() * 0.6 - 0.3;
        let sinus = Math.sin(angle);
        let cosinus = Math.cos(angle);
        let min = 64;
        let max = 0;

        for(const path of font[letter])
        {
            for(let index = 0; index < path.length; index++)
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

        let middle = position + (max - min) / 2;

        for(const path of font[letter])
        {
            let current = "";

            for(let index = 0; index < path.length; index++)
            {
                if(typeof path[index] === "number")
                {
                    let x = path[index] + position - min + 10 - middle;
                    let y = path[index + 1] - 32;
    
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
    
    for(let index = output.length - 1; index > 0; index--)
    {
        let newIndex = Math.floor(Math.random() * (index + 1));
        let value = output[index];

        output[index] = output[newIndex];
        output[newIndex] = value;
    }

    let id = randomBytes(4).toString("hex");
    let timestamp = Date.now();

    return {
        id: id,
        timestamp: timestamp,
        signature: createHmac("sha256", secret).update(`${id}${timestamp}${solution}`).digest("hex"),
        content: `<svg class="captcha-image" version="1.0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(position)} 64"><path fill="var(--text)" d="${output.join("")}"></path></svg>`
    };
}

module.exports = { createCaptcha, verifyCaptcha };