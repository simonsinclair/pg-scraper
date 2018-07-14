const fs = require('fs');

const puppeteer = require('puppeteer');
const loadJsonFile = require('load-json-file');
const mongoose = require('mongoose');
const writeJsonFile = require('write-json-file');

const CREDENTIALS = require('./credentials.js');

const havePreviousSession = fs.existsSync('./session.json');


/////////
// APP //
/////////


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
    const membersPageResponse = await page.goto('https://www.puregym.com/members/');

    // If we got returned to the login page, then login.
    if (LOGIN_URL_REGEX.test(membersPageResponse.url())) {
      await login(page);
    }

  } else {

    await login(page);

  }


  // Get & Store people count.
  //
  const peopleCount = await getPeopleCount(page);
  console.log('time:', Date.now(), 'count:', peopleCount);
  browser.close();
}

run();


// Functions
//

async function loadPreviousSessionCookies(page) {
  const cookies = await loadJsonFile('./session.json');

  if (cookies.length !== 0) {
    for (const cookie of cookies) {
      await page.setCookie(cookie);
    }
  }
}

async function saveSessionCookies(page) {
  const cookiesObject = await page.cookies();
  await writeJsonFile('./session.json', cookiesObject, { indent: 2 });
}

async function login(page) {
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
  const peopleCount = await page.evaluate((selector) => {
    const value = document.querySelector(selector).innerHTML;

    // When there are fewer than 20 people, PG doesn't
    // give us a count, so mark that result '-1'.
    if (value.startsWith('Fewer than')) { return -1; }

    // Return matched digits as a number.
    return value.match(/\d+/).map(Number);
  }, N_PEOPLE_SELECTOR);

  return peopleCount;
}
