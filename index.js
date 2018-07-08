const puppeteer = require('puppeteer');

const CREDENTIALS = require('./credentials.js');


// APP
//////

// DOM Selectors
//

// /login/
//

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
    headless: false,
  });

  const page = await browser.newPage();

  // /login
  //

  await page.goto('https://www.puregym.com/login/');

  await page.click(USERNAME_SELECTOR);
  await page.keyboard.type(CREDENTIALS.username);

  await page.click(PASSWORD_SELECTOR);
  await page.keyboard.type(CREDENTIALS.password);

  await page.click(LOGIN_SUBMIT_SELECTOR);

  await page.waitForNavigation();


  // /members
  //

  const numPeopleInMyGym = await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.innerHTML.split(' ')[0];
  }, N_PEOPLE_SELECTOR);

  console.log(numPeopleInMyGym);

  // browser.close();
}

run();
