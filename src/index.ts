import frontend from "./index.html"
import db from "./db.ts"
import frontend from "./home.html"

const loggedUsers: any = {}

const srv = Bun.serve({
    port: 3000,
    routes: {
        "/": login,

        "/user": {
            POST: async (req) => {
                const body = await req.body?.json()
                const query = db.query(`
                    INSERT INTO user(username, password_hash)
                    VALUES(:username, :password_hash)
                `)
                const hash = await Bun.password.hash(body.password)
                const data = query.run({
                    ":username": body.username,
                    ":password_hash": hash
                })
                return Response.json(data)
            },
        },

        "/login": {
            POST: async (req) => {
                const body = await req.body?.json()
                const query = db.query(`
                    SELECT * FROM user
                    WHERE username=:username
                    LIMIT 1
                `)
                const data: any = query.get({
                    ":username": body.username
                })
                if (!data) {
                    return Response.json({ msg: "usuário não encontrado" }, { status: 404 })
                }
                console.log(body.password, data.password_hash)
                const isMatch = await Bun.password.verify(body.password, data.password_hash)
                if (isMatch) {
                    loggedUsers[data.id] = data
                    const uuid = crypto.randomUUID();
                    
                    return Response.json(isMatch)
                }
                return Response.json(isMatch, { status: 401 })
            }
        }
    },
})

console.log(`Server running on ${srv.url}`)