import express from "express"
import 'dotenv/config'
import './config/dbConnect.js'
import rootRouter from "./routes/index.js"

const app = express()
const port = process.env.PORT 

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use("/api", rootRouter)

app.listen(port, ()=> {
    console.log(`Server is started ${port} on port!`);    
})