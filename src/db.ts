
import { Database } from "bun:sqlite"

const db = new Database("database.sqlite")

db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS music (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        nome TEXT NOT NULL,
        artista TEXT,
        tom TEXT,
        tempo TEXT,
        letra TEXT,
        acordes TEXT,
        afinacao TEXT
    );

    CREATE TABLE IF NOT EXISTS folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        nome TEXT NOT NULL
    );
`)

const colunas = db.query("PRAGMA table_info(music)").all() as { name: string }[]

if (!colunas.some(coluna => coluna.name === "folder_id")) {
    db.exec("ALTER TABLE music ADD COLUMN folder_id INTEGER REFERENCES folders(id)")
}

export { db }
export default db
