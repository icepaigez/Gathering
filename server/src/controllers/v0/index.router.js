"use strict";
const express = require("express");
const router = express.Router();

const { ScraperRouter } = require('./scraper/routes/scraper.router');

router.use('/scrape', ScraperRouter);


router.get('/', (req, res) => {
	res.send('v0')
});

router.post('/', (req, res) => {
	res.send('v0')
});

exports.IndexRouter = router; 