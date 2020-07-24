const express = require('express')
const bodyParser = require('body-parser')
const api = require('./src/api')

const port = 8123

app = express()
app.use(bodyParser.json({limit: '50mb'}))
app.use(express.static('public'))
app.use('/api', api)


app.listen(port, '127.0.0.1', () => console.log(`Server running: http://localhost:${port}`))

