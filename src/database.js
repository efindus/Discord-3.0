const { writeFileSync } = require("fs");

class Database
{
    #file;

    constructor(file)
    {
        this.#file = file;
        this.data = require(`../${file}`);
    }

    save()
    {
        writeFileSync(this.#file, JSON.stringify(this.data));
    }
};

module.exports = { Database };