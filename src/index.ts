//            BANCO DE DADOS     HTTP
// [C]reat    insert             post
// [R]read    select             get
// [U]pdate   update             put
// [U]pdate   update             patch
// [D]elete   delete             delete

import frontend from "./pages/index.html"
import home from "./pages/home.html"
import novaMusica from "./pages/nova-musica.html"
import { db } from "./db"

const loggedUsers: any = {}

// devolve o usuário logado (ou null se não tiver sessão)
function usuarioLogado(req: any) {
    const ses = req.cookies.get("ses")
    return ses ? loggedUsers[ses] : null
}

const srv = Bun.serve({
    port: 3000,
    routes: {
        "/" : frontend,

        "/home": home,

        "/nova-musica": novaMusica,

        "/login": {
            POST: async (req) => {
                const body = await req.body?.json()
                const query = db.query(`SELECT * FROM users WHERE username=:username LIMIT 1`)
                const data: any = query.get({ ':username': body.username })
                if (!data)
                    return Response.json({ message: "usuário não encontrado" }, { status: 404 })
                const isMatch = await Bun.password.verify(body.password, data.password_hash)
                if (!isMatch)
                    return Response.json({ message: "senha não confere" }, { status: 401 })
                const uuid = crypto.randomUUID()
                delete data.password_hash
                loggedUsers[uuid] = data
                req.cookies.set("ses", uuid)
                return Response.json(isMatch)
            },
        },

        "/login/user": (req) => {
            const ses = req.cookies.get("ses")
            if (!ses || !loggedUsers[ses])
                return Response.json({ message: "não permitido" }, { status: 401 })
            return Response.json(loggedUsers[ses])
        },

        "/user": {
            GET: () => {
                const query = db.query(`SELECT id, username, email FROM users`)
                const data = query.all()
                return Response.json(data)
            },

            POST: async (req) => {
                let body
                try {
                    body = await req.body?.json()
                } catch (error: any) {
                    return Response.json({
                        message: "JSON mal formado",
                        parseError: error
                    }, { status: 400 })
                }
                if (!body.username)
                    return Response.json({ message: "Falta da informação: username" }, { status: 400 })
                if (!body.password)
                    return Response.json({ message: "Falta da informação: password" }, { status: 400 })
                // a tela de login só pede um e-mail, então ele serve de username e de email
                const email = body.email || body.username
                const hash = await Bun.password.hash(body.password)
                const query = db.query(`
                    INSERT INTO users(username, email, password_hash)
                    VALUES(:username, :email, :password_hash)
                `)
                try {
                    const dbResp = query.run({
                        ':username': body.username,
                        ':email': email,
                        ':password_hash': hash
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
                const query = db.query(`SELECT id, username, email FROM users WHERE id=:id`)
                const data = query.get({ ':id': id })
                return Response.json(data)
            },

            PUT: async (req) => {
                let body
                try {
                    body = await req.body?.json()
                } catch (error: any) {
                    return Response.json({
                        message: "JSON mal formado",
                        parseError: error
                    }, { status: 400 })
                }
                const hash = await Bun.password.hash(body.password)
                const query = db.query(`UPDATE users SET username = :username, email = :email, password_hash = :password WHERE id = :id`)
                const dbResp = query.run({
                    ':username': body.username,
                    ':email': body.email,
                    ':password': hash,
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
            GET: (req) => {
                const user = usuarioLogado(req)
                if (!user)
                    return Response.json({ message: "não permitido" }, { status: 401 })
                const query = db.query(`SELECT * FROM music WHERE user_id=:user_id`)
                const data = query.all({ ':user_id': user.id })
                return Response.json(data)
            },

            POST: async (req) => {
                const user = usuarioLogado(req)
                if (!user)
                    return Response.json({ message: "não permitido" }, { status: 401 })
                const body = await req.body?.json()
                if (!body.nome)
                    return Response.json({ message: "Falta da informação: nome" }, { status: 400 })
                const query = db.query(`
                    INSERT INTO music(user_id, nome, artista, tom, tempo, letra, acordes, afinacao)
                    VALUES(:user_id, :nome, :artista, :tom, :tempo, :letra, :acordes, :afinacao)
                `)
                const dbResp = query.run({
                    ':user_id': user.id,
                    ':nome': body.nome,
                    ':artista': body.artista ?? null,
                    ':tom': body.tom ?? null,
                    ':tempo': body.tempo ?? null,
                    ':letra': body.letra ?? null,
                    ':acordes': body.acordes ?? null,
                    ':afinacao': body.afinacao ?? null
                })
                return Response.json({
                    "message": "deu boa garoto!",
                    dbResp
                })
            },
        },

        "/music/:id": {
            GET: (req) => {
                const user = usuarioLogado(req)
                if (!user)
                    return Response.json({ message: "não permitido" }, { status: 401 })
                const query = db.query(`SELECT * FROM music WHERE id=:id AND user_id=:user_id`)
                const data = query.get({ ':id': req.params.id, ':user_id': user.id })
                return Response.json(data)
            },

            PUT: async(req) => {
                const user = usuarioLogado(req)
                if (!user)
                    return Response.json({ message: "não permitido" }, { status: 401 })
                const body = await req.body?.json()
                const query = db.query(`
                    UPDATE music
                    SET nome = :nome, artista = :artista, tom = :tom, tempo = :tempo, letra = :letra, acordes = :acordes, afinacao = :afinacao
                    WHERE id = :id AND user_id = :user_id
                `)
                const dbResp = query.run({
                    ':nome': body.nome,
                    ':artista': body.artista ?? null,
                    ':tom': body.tom ?? null,
                    ':tempo': body.tempo ?? null,
                    ':letra': body.letra ?? null,
                    ':acordes': body.acordes ?? null,
                    ':afinacao': body.afinacao ?? null,
                    ':id': req.params.id,
                    ':user_id': user.id
                })
                return Response.json(dbResp)
            },

            DELETE: (req) => {
                const user = usuarioLogado(req)
                if (!user)
                    return Response.json({ message: "não permitido" }, { status: 401 })
                const query = db.query(`DELETE FROM music WHERE id=:id AND user_id=:user_id`)
                const data = query.run({ ':id': req.params.id, ':user_id': user.id })
                return Response.json(data)
            },
        },
    }
})

console.log(`Servidor em ${srv.url}`)