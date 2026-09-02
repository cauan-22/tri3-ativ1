const srv = Bun.serve({
    port: 3000,
    routes: {
        "/test": {
            GET: () => {
                const url = new URL(req.url)
                const search = url.searchParams
                const nome = search.get("nome")
                console.log(nome)
                return new Response("_SEU_NOME get")
            },
            POST: async (req) => {
                const body = await req.body.text()
                console.log(body)
                return new Response("_SEU_NOME post")
            },
                PUT: () => new Response("_SEU_NOME put"),
                DELETE: () => new Response("_SEU_NOME delete"),
        }     
    }
    })

    console.log(`Server running: ${srv.url}`)