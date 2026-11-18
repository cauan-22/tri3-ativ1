import { Database } from "bun:sqlite"

const db = new Database("database.sqlite")

const tabelaNova = !db.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'music_folders'").get()

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

    CREATE TABLE IF NOT EXISTS music_folders (
        music_id INTEGER NOT NULL REFERENCES music(id) ON DELETE CASCADE,
        folder_id INTEGER NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
        PRIMARY KEY (music_id, folder_id)
    );
`)

const colunas = db.query("PRAGMA table_info(music)").all() as { name: string }[]

if (tabelaNova && colunas.some(coluna => coluna.name === "folder_id")) {
    db.exec(`
        INSERT INTO music_folders(music_id, folder_id)
        SELECT id, folder_id FROM music WHERE folder_id IS NOT NULL;

        UPDATE music SET folder_id = NULL;
    `)
}

export { db }
export default db