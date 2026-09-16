//           Banco de Dados   HTTP
// [C]reate  insert           post
// [R]ead    select           get
// [U]pdate  update           put
// [U]pdate  update           patch
// [D]elete  delete           delete
// 

import { db } from "./db"

const srv = Bun.serve({
    port: 3000,
    routes: {
        "/user": {
            GET: () => Response.json("", { status: 501 }),
            
            POST: async (req) => {
                const body = await req.body.json();
                const query = db.query(`
                    INSERT INTO users(username, email, password_hash)
                    VALUES(:username, :email, :password_hash)    
                `)
                const dbResp = query.run({
                    ':username': body.username,
                    ':email' : body.email,
                    ':password_hash':  body.password
                })
                return Response.json({
                    "message": "deu bom",
                    dbResp
                })
            },

        },

        "/user/:id": {
            GET: (req) => {
                const query = db.query(`
                    SELECT * FROM users
                    WHERE id=:_id_
                `)
                const deResp = query.get({ ":_id_": req.params.id })
                return Response.json(deResp)
            },

            PUT: async (req) => {
                const body = await req.body.json();
                const query = db.query(`
                    UPDATE users 
                    SET username=:username, email=:email, :password_hash
                    WHERE id=:_id_;
                `)
                const deResp = query.run({
                    ':username': body.username,
                    ':email' : body.email,
                    ':password_hash':  body.password
                })
                return Response.json(deResp)
            },

            DELETE: (req) => {
                const body = await req.body.json();
                const query = db.query(`
                   DELETE FROM users 
                   WHERE id=:_id_;
                `)
                const deResp = query.get({ ":_id_": req.params.id })
                return Response.json(deResp)
            },
        }
    }
})

console.log(`Server running: ${srv.url}`)