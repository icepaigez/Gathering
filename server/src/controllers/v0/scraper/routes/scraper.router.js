"use strict";
const express = require("express");
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const randomUA = require("puppeteer-extra-plugin-anonymize-ua");
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const bluebird = require("bluebird"); 
const router = express.Router();
const LocalStorage = require('node-localstorage').LocalStorage;
const localStorage = new LocalStorage('./scratch');
const fs = require('fs');

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({blockTrackers: true}));
puppeteer.use(randomUA());
const block_resources = ['image', 'stylesheet', 'media', 'font', 'texttrack', 'object', 'beacon', 'csp_report', 'imageset'];
const minimal_args = [
  '--autoplay-policy=user-gesture-required',
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-breakpad',
  '--disable-client-side-phishing-detection',
  '--disable-component-update',
  '--disable-default-apps',
  '--disable-dev-shm-usage',
  '--disable-domain-reliability',
  '--disable-extensions',
  '--disable-features=AudioServiceOutOfProcess',
  '--disable-hang-monitor',
  '--disable-ipc-flooding-protection',
  '--disable-notifications',
  '--disable-offer-store-unmasked-wallet-cards',
  '--disable-popup-blocking',
  '--disable-print-preview',
  '--disable-prompt-on-repost',
  '--disable-renderer-backgrounding',
  '--disable-setuid-sandbox',
  '--disable-speech-api',
  '--disable-sync',
  '--hide-scrollbars',
  '--ignore-gpu-blacklist',
  '--metrics-recording-only',
  '--mute-audio',
  '--no-default-browser-check',
  '--no-first-run',
  '--no-pings',
  '--no-sandbox',
  '--no-zygote',
  '--password-store=basic',
  '--use-gl=swiftshader',
  '--use-mock-keychain',
  // '--single-process'
];

const launchBrowser = async() => {
	try {
		let browser = await puppeteer.launch({ headless: false, args: minimal_args });
		let browserWSEndpoint = await browser.wsEndpoint();
		localStorage.setItem('browserWSEndpoint', browserWSEndpoint) //save
	} catch(err) {
		console.log('error occurred when creating browser', err)
	}
}

// const useBrowser = async(urlArray) => {
// 	try {
// 		let browserWSEndpoint, browser;
// 		if (localStorage.getItem('browserWSEndpoint') != null) {
// 			browserWSEndpoint = localStorage.getItem('browserWSEndpoint')
// 			browser = await puppeteer.connect({ browserWSEndpoint })
// 			return await bluebird.map(urlArray, async url => {
// 				console.log(urlArray)
// 				// const page = await browser.newPage();
// 				// await page.setRequestInterception(true);
// 				// //block unnecessary requests
// 				// page.on('request', request => {
// 				// 	if (block_resources.indexOf(request.resourceType()) > 0) {
// 				// 		request.abort();
// 				// 	} else {
// 				// 		request.continue();
// 				// 	}
// 				// })
// 				// page.on('error', err => {
// 				// 	console.log('error on the page', err)
// 				// })
// 				// page.on('pageerror', pagerr => {
// 				// 	console.log(' second error on the page', pagerr)
// 				// })
// 				// await page.goto(url, {waitUntil: 'networkidle2'});
// 				// let scriptData = await page.$$eval('script', async scripts => {
// 				// 	let data = await scripts.map(script => script.getAttribute('src'))
// 				// 	let competitor = data.filter(str => str.includes('leandata'))
// 				// 	return competitor;
// 				// })
// 				// //save to DB
// 				// fs.writeFile('data.txt', scriptData[0], err => {
// 				// 	if (err) return console.log(err);
// 				// })
// 			}, {concurrency: 3})
// 		} else {
// 			await launchBrowser().then(async() => {
// 				await useBrowser(urlArray)
// 			});
// 		}
// 	} catch(err) {
// 		console.log('error when using browser', err)
// 		//existing browser crashed, launch a new instance and open the web pages
// 		await launchBrowser().then(async() => {
// 			await useBrowser(urlArray)
// 		});
// 	}
// 	return 'data has been saved';
// }

const useBrowser = async(urlArray) => {
	let browser = await puppeteer.launch({ headless: false, args: minimal_args });
	await bluebird.map(urlArray, async url => {
		const page = await browser.newPage();
		await page.setRequestInterception(true);
		//block unnecessary requests
		page.on('request', request => {
			if (block_resources.indexOf(request.resourceType()) > 0) {
				request.abort();
			} else {
				request.continue();
			}
		})
		page.on('error', err => {
			console.log('error on the page', err)
		})
		page.on('pageerror', pagerr => {
			console.log('second error on the page', pagerr)
		})
		await page.goto(url, {waitUntil: 'networkidle2'});
		let scriptData = await page.$$eval('script', async scripts => {
			let data = await scripts.map(script => script.getAttribute('src'))
			let competitor = data.filter(str => str.includes('leandata'))
			return competitor;
		})
		//save to temporary DB
		fs.writeFile('data.txt', scriptData[0], err => {
			if (err) return console.log(err);
		})
	}, {concurrency: 3})
	return 'data saved';
}

router.get('/', async (req, res) => {
	res.send('get endpoint')
});

router.post('/use-browser', async (req, res) => {
	res.sendStatus(200)
});

exports.ScraperRouter = router;  
exports.useBrowser = useBrowser;

//https://github.com/puppeteer/puppeteer/issues/4428 - production code