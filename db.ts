import { Database } from "bun:sqlite";

const db = new Database("database.sqlite");
const query = db.query(`
    CREATE TABLE IF NOT EXISTS users (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        username        TEXT NOT NULL UNIQUE,
        email           TEXT NOT NULL UNIQUE,
        password_hash   TEXT NOT NULL
    )
`);

const query2 = db.query(`
     CREATE TABLE IF NOT EXISTS music (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        nome        TEXT NOT NULL,
        artista     TEXT NOT NULL,
        tempo       TEXT NOT NULL,
        acordes     TEXT NOT NULL,
        afinacao    TEXT NOT NULL
        );
    `)
query.run();
query2.run();
export { db }