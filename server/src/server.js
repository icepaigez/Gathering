"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');


const { IndexRouter } = require('./controllers/v0/index.router');
const { useBrowser } = require('./controllers/v0/scraper/routes/scraper.router') 
const { urls } = require('./data');

const PORT = process.env.PORT || 4000;
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use('/api/v0/', IndexRouter);

app.get('/', (req, res) => {
	res.send('/api/v0/') 
});  
 
app.post('/', (req, res) => {
	res.send('/api/v0/') 
}); 

app.listen(PORT, async() => {
	console.log(`The server is running on port ${ PORT }`)
})

//useBrowser(urls).then(console.log)
//console.log(urls)