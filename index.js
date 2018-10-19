const fs = require('fs');
const os = require('os');

const puppeteer = require('puppeteer');
const loadJsonFile = require('load-json-file');
const mongoose = require('mongoose');
const writeJsonFile = require('write-json-file');
const winston = require('winston');


/////////
// APP //
/////////

const BASE_PATH = `${os.homedir()}/Desktop`;

const logger = winston.createLogger({
  format: winston.format.combine(
    // winston.format.colorize(),
    winston.format.timestamp(),
    // winston.format.align(),
    winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: `${BASE_PATH}/pg-scraper.log`,
      handleExceptions: true,
    }),
  ],
});
const profiler = logger.startTimer();
logger.info('Starting.');

const CREDENTIALS = require('./credentials.js');
const Count = require('./models/Count.js');

const havePreviousSession = fs.existsSync(`${BASE_PATH}/session.json`);
logger.info(`havePreviousSession ${havePreviousSession}`);

// /login/
//

const LOGIN_URL_REGEX = RegExp('.*\.puregym\.com\/login', 'i');

const USERNAME_SELECTOR = '#email';
const PASSWORD_SELECTOR = '#pin';
const LOGIN_SUBMIT_SELECTOR = '#login-submit';


// /members/
//

const N_PEOPLE_SELECTOR = '#main-content > div:nth-child(2) > div > div > div:nth-child(2) > div > div > div > div:nth-child(1) > div > p.para.para--small.margin-none > span';


// Run
//

async function run() {
  const browser = await puppeteer.launch({
    // headless: false,
  });

  const page = await browser.newPage();

  // Check if we have a previous session we can load.
  if (havePreviousSession) {

    await loadPreviousSessionCookies(page);
    logger.info('Going to members page.');
    const membersPageResponse = await page.goto('https://www.puregym.com/members/');

    // If we got redirected to the login page, then login.
    if (LOGIN_URL_REGEX.test(membersPageResponse.url())) {
      logger.info('Returned to login page.');
      await login(page);
    }

  } else {

    await login(page);

  }


  // Get.
  const peopleCount = await getPeopleCount(page);
  const count = new Count({
    timestamp: peopleCount.timestamp,
    value: peopleCount.value,
  });

  // Store.
  await mongoose.connect('mongodb://localhost/pgScraper');
  await count.save();
  mongoose.disconnect();

  browser.close();
}

run()
  .then(() => {
    profiler.done();
  });

// Functions
//

async function loadPreviousSessionCookies(page) {
  logger.info('loadPreviousSessionCookies');
  const cookies = await loadJsonFile('./session.json');

  if (cookies.length !== 0) {
    for (const cookie of cookies) {
      await page.setCookie(cookie);
    }
  }
}

async function saveSessionCookies(page) {
  logger.info('saveSessionCookies');
  const cookiesObject = await page.cookies();
  await writeJsonFile(`${BASE_PATH}/session.json`, cookiesObject, { indent: 2 });
}

async function login(page) {
  logger.info('login');
  await page.goto('https://www.puregym.com/login/');

  await page.click(USERNAME_SELECTOR);
  await page.keyboard.type(CREDENTIALS.username);

  await page.click(PASSWORD_SELECTOR);
  await page.keyboard.type(CREDENTIALS.password);

  await page.click(LOGIN_SUBMIT_SELECTOR);

  await page.waitForNavigation();
  await saveSessionCookies(page);
}

async function getPeopleCount(page) {
  logger.info('getPeopleCount');
  const peopleCount = await page.evaluate((selector) => {
    const value = document.querySelector(selector).innerHTML;

    // When there are fewer than 20 people, PG doesn't give us
    // a count - mark the result so we can process later.
    if (value.startsWith('Fewer than')) { return -20; }

    // Return matched digits as a number.
    return value.match(/\d+/).map(Number)[0];
  }, N_PEOPLE_SELECTOR);

  return {
    timestamp: Date.now(),
    value: peopleCount,
  };
}
