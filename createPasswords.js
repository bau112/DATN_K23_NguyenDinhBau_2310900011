
const bcrypt = require("bcrypt");

async function createPasswords() {
    const accounts = [
        {
            username: "admin",
            password: "11345276"
        },
        {
            username: "teacher01",
            password: "11345276"
        },
        {
            username: "student01",
            password: "11345276"
        }
    ];

    for (const account of accounts) {
        const hashedPassword = await bcrypt.hash(account.password, 10);

        console.log("Username:", account.username);
        console.log("Password hash:", hashedPassword);
        console.log("-------------------------");
    }
}

createPasswords();
