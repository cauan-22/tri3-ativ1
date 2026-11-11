import { Database } from "bun:sqlite"

const db = new Database("database.sqlite")

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        username        TEXT NOT NULL UNIQUE,
        email           TEXT NOT NULL UNIQUE,
        password_hash   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS music (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id         INTEGER NOT NULL REFERENCES users(id),
        nome            TEXT NOT NULL,
        artista         TEXT,
        tom             TEXT,
        tempo           TEXT,
        letra           TEXT,
        acordes         TEXT,
        afinacao        TEXT
    );
`);

export { db }
export default db