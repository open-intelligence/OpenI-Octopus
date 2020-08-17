//  Copyright (c) Peking University 2018
//
//  The software is released under the Open-Intelligence Open Source License V1.0.
//  The copyright owner promises to follow "Open-Intelligence Open Source Platform
//  Management Regulation V1.0", which is provided by The New Generation of 
//  Artificial Intelligence Technology Innovation Strategic Alliance (the AITISA).

const express = require('express')
const app = express()
app.use(express.static('public'))
app.get('/', (req, res) => res.sendFile('index.html', {"root": __dirname}))

app.listen(8080, () => console.log('vis is listening on port 8000!'))