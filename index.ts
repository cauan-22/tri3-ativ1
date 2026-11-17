
import frontend from "./pages/index.html"
import home from "./pages/home.html"
import novaMusica from "./pages/nova-musica.html"
import musica from "./pages/musica.html"
import musicas from "./pages/musicas.html"
import pastas from "./pages/pastas.html"
import { db } from "./db"

const loggedUsers: any = {}

function usuarioLogado(req: any) {
    const ses = req.cookies.get("ses")
    return ses ? loggedUsers[ses] : null
}

function naoAutorizado() {
    return Response.json({ message: "não permitido" }, { status: 401 })
}

const srv = Bun.serve({
    port: 3000,
    routes: {
        "/": frontend,
        "/home": home,
        "/nova-musica": novaMusica,
        "/musica/:id": musica,
        "/musicas": musicas,
        "/pastas": pastas,

        "/login": {
            POST: async (req) => {
                const body = await req.body?.json()
                const query = db.query("SELECT * FROM users WHERE username=:username LIMIT 1")
                const data: any = query.get({ ":username": body.username })

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
            }
        },

        "/login/user": (req) => {
            const ses = req.cookies.get("ses")

            if (!ses || !loggedUsers[ses])
                return naoAutorizado()

            return Response.json(loggedUsers[ses])
        },

        "/user": {
            GET: () => {
                const query = db.query("SELECT id, username, email FROM users")
                return Response.json(query.all())
            },

            POST: async (req) => {
                let body

                try {
                    body = await req.body?.json()
                } catch {
                    return Response.json({ message: "JSON mal formado" }, { status: 400 })
                }

                if (!body.username || !body.password)
                    return Response.json({ message: "Preencha os campos obrigatórios" }, { status: 400 })

                const email = body.email || body.username
                const hash = await Bun.password.hash(body.password)

                try {
                    const query = db.query(`
                        INSERT INTO users(username, email, password_hash)
                        VALUES(:username, :email, :password_hash)
                    `)

                    const dbResp = query.run({
                        ":username": body.username,
                        ":email": email,
                        ":password_hash": hash
                    })

                    return Response.json({ message: "Usuário cadastrado", dbResp })
                } catch (e: any) {
                    if (e.code === "SQLITE_CONSTRAINT_UNIQUE")
                        return Response.json({ message: "Username e Email precisam ser únicos" }, { status: 400 })

                    return Response.json({ message: "Erro ao cadastrar usuário" }, { status: 500 })
                }
            }
        },

        "/music": {
            GET: (req) => {
                const user = usuarioLogado(req)
                if (!user) return naoAutorizado()

                const query = db.query(`
                    SELECT music.*, folders.nome AS pasta_nome
                    FROM music
                    LEFT JOIN folders ON folders.id = music.folder_id
                    WHERE music.user_id = :user_id
                `)

                return Response.json(query.all({ ":user_id": user.id }))
            },

            POST: async (req) => {
                const user = usuarioLogado(req)
                if (!user) return naoAutorizado()

                const body = await req.body?.json()

                if (!body.nome)
                    return Response.json({ message: "Informe o nome da música" }, { status: 400 })

                const query = db.query(`
                    INSERT INTO music(user_id, nome, artista, tom, tempo, letra, acordes, afinacao)
                    VALUES(:user_id, :nome, :artista, :tom, :tempo, :letra, :acordes, :afinacao)
                `)

                const dbResp = query.run({
                    ":user_id": user.id,
                    ":nome": body.nome,
                    ":artista": body.artista ?? null,
                    ":tom": body.tom ?? null,
                    ":tempo": body.tempo ?? null,
                    ":letra": body.letra ?? null,
                    ":acordes": body.acordes ?? null,
                    ":afinacao": body.afinacao ?? null
                })

                return Response.json({ message: "Música cadastrada", dbResp })
            }
        },

        "/music/:id": {
            GET: (req) => {
                const user = usuarioLogado(req)
                if (!user) return naoAutorizado()

                const query = db.query(`
                    SELECT * FROM music
                    WHERE id = :id AND user_id = :user_id
                `)

                const data = query.get({
                    ":id": req.params.id,
                    ":user_id": user.id
                })

                return Response.json(data)
            },

            PUT: async (req) => {
                const user = usuarioLogado(req)
                if (!user) return naoAutorizado()

                const body = await req.body?.json()

                const query = db.query(`
                    UPDATE music
                    SET nome = :nome,
                        artista = :artista,
                        tom = :tom,
                        tempo = :tempo,
                        letra = :letra,
                        acordes = :acordes,
                        afinacao = :afinacao
                    WHERE id = :id AND user_id = :user_id
                `)

                const dbResp = query.run({
                    ":nome": body.nome,
                    ":artista": body.artista ?? null,
                    ":tom": body.tom ?? null,
                    ":tempo": body.tempo ?? null,
                    ":letra": body.letra ?? null,
                    ":acordes": body.acordes ?? null,
                    ":afinacao": body.afinacao ?? null,
                    ":id": req.params.id,
                    ":user_id": user.id
                })

                return Response.json(dbResp)
            },

            DELETE: (req) => {
                const user = usuarioLogado(req)
                if (!user) return naoAutorizado()

                const query = db.query(`
                    DELETE FROM music
                    WHERE id = :id AND user_id = :user_id
                `)

                return Response.json(query.run({
                    ":id": req.params.id,
                    ":user_id": user.id
                }))
            }
        },

        "/music/:id/folder": {
            PATCH: async (req) => {
                const user = usuarioLogado(req)
                if (!user) return naoAutorizado()

                const body = await req.body?.json()

                if (body.folderId !== null && body.folderId !== undefined) {
                    const pasta = db.query(`
                        SELECT id FROM folders
                        WHERE id = :id AND user_id = :user_id
                    `).get({
                        ":id": body.folderId,
                        ":user_id": user.id
                    })

                    if (!pasta)
                        return Response.json({ message: "Pasta não encontrada" }, { status: 404 })
                }

                const query = db.query(`
                    UPDATE music
                    SET folder_id = :folder_id
                    WHERE id = :id AND user_id = :user_id
                `)

                return Response.json(query.run({
                    ":folder_id": body.folderId ?? null,
                    ":id": req.params.id,
                    ":user_id": user.id
                }))
            }
        },

        "/folder": {
            GET: (req) => {
                const user = usuarioLogado(req)
                if (!user) return naoAutorizado()

                const query = db.query(`
                    SELECT folders.*, COUNT(music.id) AS total_musicas
                    FROM folders
                    LEFT JOIN music ON music.folder_id = folders.id
                    WHERE folders.user_id = :user_id
                    GROUP BY folders.id
                    ORDER BY folders.nome
                `)

                return Response.json(query.all({ ":user_id": user.id }))
            },

            POST: async (req) => {
                const user = usuarioLogado(req)
                if (!user) return naoAutorizado()

                const body = await req.body?.json()
                const nome = body.nome?.trim()

                if (!nome)
                    return Response.json({ message: "Informe o nome da pasta" }, { status: 400 })

                const query = db.query(`
                    INSERT INTO folders(user_id, nome)
                    VALUES(:user_id, :nome)
                `)

                return Response.json(query.run({
                    ":user_id": user.id,
                    ":nome": nome
                }))
            }
        },

        "/folder/:id": {
            PUT: async (req) => {
                const user = usuarioLogado(req)
                if (!user) return naoAutorizado()

                const body = await req.body?.json()
                const nome = body.nome?.trim()

                if (!nome)
                    return Response.json({ message: "Informe o nome da pasta" }, { status: 400 })

                const query = db.query(`
                    UPDATE folders SET nome = :nome
                    WHERE id = :id AND user_id = :user_id
                `)

                return Response.json(query.run({
                    ":nome": nome,
                    ":id": req.params.id,
                    ":user_id": user.id
                }))
            },

            DELETE: (req) => {
                const user = usuarioLogado(req)
                if (!user) return naoAutorizado()

                db.query(`
                    UPDATE music SET folder_id = NULL
                    WHERE folder_id = :id AND user_id = :user_id
                `).run({
                    ":id": req.params.id,
                    ":user_id": user.id
                })

                const query = db.query(`
                    DELETE FROM folders
                    WHERE id = :id AND user_id = :user_id
                `)

                return Response.json(query.run({
                    ":id": req.params.id,
                    ":user_id": user.id
                }))
            }
        },

        "/folder/:id/musics": {
            GET: (req) => {
                const user = usuarioLogado(req)
                if (!user) return naoAutorizado()

                const pasta = db.query(`
                    SELECT id FROM folders
                    WHERE id = :id AND user_id = :user_id
                `).get({
                    ":id": req.params.id,
                    ":user_id": user.id
                })

                if (!pasta)
                    return Response.json({ message: "Pasta não encontrada" }, { status: 404 })

                const query = db.query(`
                    SELECT * FROM music
                    WHERE folder_id = :folder_id AND user_id = :user_id
                    ORDER BY nome
                `)

                return Response.json(query.all({
                    ":folder_id": req.params.id,
                    ":user_id": user.id
                }))
            }
        }
    }
})

console.log(`Servidor em ${srv.url}`)
