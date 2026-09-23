//            BANCO DE DADOS     HTTP
// [C]reat    insert             post
// [R]read    select             get
// [U]pdate   update             put
// [U]pdate   update             patch
// [D]elete   delete             delete

import { db } from "./db"

const srv = Bun.serve({
    port: 3000,
    routes: {
        "/user": {
            GET: () => {
                const query = db.query(`SELECT * FROM users`)
                const data = query.all()
                return Response.json(data)
            },

            POST: async (req) => {
                let body
                try {
                    body = await req.body.json()
                } catch (error: any) {
                    return Response.json({
                        message: "JSON mal formado",
                        parseError: error
                    }, { status: 400 })
                }
                if (!body.username)
                    return Response.json({ message: "Falta da informação: username" }, { status: 400 })
                if (!body.email)
                    return Response.json({ message: "Falta da informação: email" }, { status: 400 })
                if (!body.password)
                    return Response.json({ message: "Falta da informação: password" }, { status: 400 })
                const query = db.query(`
                    INSERT INTO users(username, email, password_hash)
                    VALUES(:username, :email, :password_hash)
                `)
                try {
                    const dbResp = query.run({
                        ':username': body.username,
                        ':email': body.email,
                        ':password_hash': body.password
                    })
                    return Response.json({
                        "message": "deu boa garote!",
                        dbResp
                    })
                } catch (e: any) {
                    if (e.code == "SQLITE_CONSTRAINT_UNIQUE") {
                        return Response.json({
                            message: "Username e Email precisam ser únicos",
                            code: "UNIQUE:CONSTRAINT"
                        }, { status: 400 })
                    }
                    return Response.json({
                        message: "Erro ao inserir no banco de dados",
                        dbError: e
                    }, { status: 500 })
                }
            },
        },

        "/user/:id": {
            GET: (req) => {
                const id = req.params.id
                const query = db.query(`SELECT * FROM users WHERE id=:id`)
                const data = query.get({ ':id': id })
                return Response.json(data)
            },

            PUT: async (req) => {
                try {
                    body = await req.body.json()
                } catch (error: any) {
                    return Response.json({
                        message: "JSON mal formado",
                        parseError: error
                    }, { status: 400 })
                }
                const query = db.query(`UPDATE users SET username = :username, email = :email, password_hash = :password WHERE id = :id`)
                const dbResp = query.run({
                    ':username': body.username,
                    ':email': body.email,
                    ':password': body.password,
                    ':id': req.params.id
                })
                return Response.json(dbResp)
            },

            DELETE: (req) => {
                const query = db.query(`DELETE FROM users WHERE id=:id`)
                const data = query.run({ ':id': req.params.id })
                return Response.json(data)
            },
        },

        "/music": {
           GET: () => {
                const query = db.query(`SELECT * FROM music`)
                const data = query.all()
                return Response.json(data)
            },

            POST: async (req) => {
                const body = await req.body.json()
                const query = db.query(`
                    INSERT INTO music(nome, artista, tempo, acordes, afinacao)
                    VALUES(:nome, :artista, :tempo, :acordes, :afinacao)
                `)
                const dbResp = query.run({
                    ':nome': body.nome,
                    ':artista': body.artista,
                    ':tempo': body.tempo,
                    ':acordes': body.acordes,
                    ':afinacao': body.afinacao
                })
                return Response.json({
                    "message": "deu boa garoto!",
                    dbResp
                })
            },
        },

        "/music/:id": {
            GET: (req) => {
                const id = req.params.id
                const query = db.query(`SELECT * FROM music WHERE id=:id`)
                const data = query.get({ ':id': id })
                return Response.json(data)
            },

            PUT: async(req) => {
                const body = await req.body.json()
                const query = db.query(`UPDATE music SET nome = :nome, artista = :artista, tempo = :tempo, acordes = :acordes, afinacao = :afinacao WHERE id = :id`)
                const dbResp = query.run({
                    ':nome': body.nome,
                    ':artista': body.artista,
                    ':tempo': body.tempo,
                    ':acordes': body.acordes,
                    ':afinacao': body.afinacao,
                    ':id': req.params.id
                })
                return Response.json(dbResp)
            },

            DELETE: (req) => {
                const query = db.query(`DELETE FROM music WHERE id=:id`)
                const data = query.run({ ':id': req.params.id })
                return Response.json(data)
            },
        },
    }
})

console.log(`Servidor em ${srv.url}`)