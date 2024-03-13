

function generateDevelopersStackResourceName(name, type, length) {
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let generatedName = "";

    for (let i = 0; i < length; i++) {
        generatedName += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }

    generatedName += "-OH-" + type + "-" + name;

    return generatedName;
}

module.exports = generateDevelopersStackResourceName;