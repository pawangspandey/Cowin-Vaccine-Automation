const puppeteer = require('puppeteer');
const inquirer = require('inquirer');
const otpManager = require('./otpManager');
const moment = require('moment');

const Promise = require('bluebird');

const delay = (time = 100) => new Promise((res) => {
  setTimeout(res, time);
});
let ts;
let auth;


const getAuthToken = async (mobileNumber) => {
  if ((ts && moment.duration(moment().diff(moment(ts))).as('minutes') > 14) || !ts) {
    ts = new Date();
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    // set user agent (override the default headless User Agent)
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36');
    await page.goto('https://selfregistration.cowin.gov.in', { waitUntil: 'networkidle0' });
    await page.evaluate((mobileNumber) => {
      // input Mobile number
      let eventMobile = new Event('input', { bubbles: true });
      document.querySelectorAll('[formcontrolname = "mobile_number"]')[0].value = mobileNumber;
      document.querySelectorAll('[formcontrolname = "mobile_number"]')[0].dispatchEvent(eventMobile);


      // get otp
      var getOtpButton = document.getElementsByClassName("button")[0];
      getOtpButton.click()

    }, mobileNumber);

    notify({
      title: "Cowin Urgent !!!",
      message: "Make sure keep the android app running"
    });

    let otp = null;

    while (otp == null) {
      otp = await otpManager.readReceivedOtp(ts);
    }

    await page.evaluate((otp) => {
      // input otp 
      let eventOtp = new Event('input', { bubbles: true });
      document.querySelectorAll('[formcontrolname = "otp"]')[0].value = otp;
      document.querySelectorAll('[formcontrolname = "otp"]')[0].dispatchEvent(eventOtp);

      // Otp Send

      var VerifyOtpButton = document.getElementsByClassName("button")[0];
      VerifyOtpButton.click()
    }, otp);

    await delay(1000);
    // await page.waitForResponse(response => response.status() === 200);

    const authSession = await page.evaluate(_ => {
      return JSON.parse(JSON.stringify(sessionStorage));
    });
    await browser.close();
    auth = authSession;
  }
  auth.userToken = auth.userToken.replace(/\"/g,'');
  return auth;
}




// const notifier =  require('node-notifier');
const notifier = require('node-notifier');

const notify = ({ title, message, open }) => {
  let option = Object.assign({
    // icon: path.join(__dirname, 'coulson.jpg'), // Absolute path (doesn't work on balloons)
    sound: true, // Only Notification Center or Windows Toasters
    // wait: true, // Wait with callback, until user action is taken against notification, does not apply to Windows Toasters as they always wait or notify-send as it does not support the wait option
    // reply: true
  }, {
    title,
    message,
    open
  })
  notifier.notify(option,
    function (err, response, metadata) {
      //  console.log(JSON.stringify(response), metadata);
      // Response is response from notification
      // Metadata contains activationType, activationAt, deliveredAt
    }
  );

  notifier.on('click', function (notifierObject, options, event) {
    // Triggers if `wait: true` and user clicks notification
  });

  notifier.on('timeout', function (notifierObject, options) {
    // Triggers if `wait: true` and notification closes
  });
}

module.exports = {
  getAuthToken,
  notify
};