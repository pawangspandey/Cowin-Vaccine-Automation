
const configManager = require("./utils/configManager");
const askBookingQuestions = require("./utils/askBookingQuestions");
const authTool = require("./utils/getAuthToken");
const mqttService = require("./utils/mqttService");
const cowinAPI = require('./utils/cowinApi');
const inquirer = require("inquirer");
const fs = require('fs').promises
const path = require('path');
let captchaPath =  path.join(__dirname, "./captcha.svg");

let working = false;
let serviceInitialized = false;
let successBooked = false;


const ensureConfig = configManager
  .isConfigExist()
  .then(async exist => {
    if (!exist) {
      let data = await askBookingQuestions();
      data.mqttTopic = Math.random().toString(36).substr(2, 9);
      await configManager.writeConfig(data);
    }
    return configManager.readConfig();
  })

const runMqttService = async (topic) => {
  await mqttService.connectMqtt();
  await mqttService.subscribe(topic);
  console.log(`please send the otp on ${topic}`);
}


const autoBook = async () => {
  if (!working) {
    await ensureConfig
    .then(async config => {
      working = true;
      const auth = await authTool.getAuthToken(config.mobileNumber);
      console.log(auth);
      return [config, auth]
    })
    .then(async ([config, auth]) => {
      let centers = [];
      console.log(config);
      if (config.districtWiseORPincodeWise == "district wise") {
        centers = await cowinAPI.getDistrictWiseSessionAvailablePrivate(config.selectedDistrictsIds, auth);
      } else {
        centers = await cowinAPI.getPinWiseSessionAvailablePrivate(config.selectedPincodes, auth);
      }
      return [config, auth, centers];
    })
    .then(async ([config, auth, centers]) => {
      // select center based on fee type
      if (config.feeType != "Any") {
        centers = centers.filter((c) => c.fee_type == config.feeType);
      }
      return [config, auth, centers];
    })
    .then(async ([config, auth, centers]) => {
      // select center based on vaccine type
      if (config.vaccinePreference != "ANY") {
        centers = centers.filter((c) => c.sessions.vaccine == config.vaccinePreference);
      }
      return [config, auth, centers];
    })
    .then(async ([config, auth, centers]) => {
      // select based on minimum age
      centers = centers.filter((c) => c.sessions.min_age_limit == config.minimumAge);
      return [config, auth, centers];
    })
    .then(async ([config, auth, centers]) => {
      // select center based on slot need
      centers = centers.filter((c) => c.sessions[`available_capacity_dose${config.doseNumber}`] > parseInt(config.minimumSlotRequired));
      console.log('centers.length', centers.length);
      return [config, auth, centers];
    })
    .then(async ([config, auth, centers]) => {
      if (!centers.length > 0) {
        throw new Error("No session available");
      }
      let selectedCenter = centers[0];
      return [config, auth, selectedCenter];
    })
    .then(async ([config, auth, selectedCenter]) => {
      console.log("selected center", selectedCenter);
      let beneficiaries = await cowinAPI.getBeneficiaries(auth);
      let selectedSession = selectedCenter.sessions;
      beneficiaries = beneficiaries.data.beneficiaries;
      beneficiaries = beneficiaries.map(b => b.beneficiary_reference_id);
      let session_id = selectedSession.session_id;
      const bookingData = {
        "dose":  config.doseNumber,
        "session_id": session_id,
        "slot": selectedSession.slots[0],
        "beneficiaries": beneficiaries,
        center_id: selectedCenter.center_id,
      }
      return [config, auth, bookingData]
    })
    .then(async ([config, auth, bookingData]) => {
      let retry = 3;
      console.log(bookingData);
      while (!successBooked && retry > 0) {
        retry -= 1;

        /*** Ask for captcha *****/
        // As per the new update on cowin we don't need to even ask for captcha
        /**
        const response = await cowinAPI.getCaptcha({}, auth);
        await fs.writeFile(captchaPath, response.data.captcha, 'utf-8');
        authTool.notify({
          "title": "New Captch",
          "message": `see at ${captchaPath}`
        })
        console.log(`check new captcha at ${captchaPath}`);
        const {captcha} =  await inquirer.prompt([{
          type: 'input',
          name: 'captcha',
          message: "please enter valid captcha?"
        }]);

        bookingData.captcha = captcha;
        */


        try {
          result = await cowinAPI.bookAppointment(bookingData, auth);
          
          successBooked = true;
          working = false;
          scheduler.stop();
        } catch (error) {
          console.log("get error", error);
          console.log(`Retrying ${retry} times`);
          if (retry <= 0) {
            working = false;
          }
        }
      }
    })
    .catch((e) => {
      console.log(e);
      // enable next booking window
      working = false;
    })
  }
}


const { ToadScheduler, SimpleIntervalJob, AsyncTask } = require('toad-scheduler')
const scheduler = new ToadScheduler();

const task = new AsyncTask(
  'Book Session task', 
  autoBook
)

const job = new SimpleIntervalJob({ seconds: 30 }, task)

scheduler.addSimpleIntervalJob(job)

// initialize the config and services
ensureConfig.then(async (config) => {
  if (!serviceInitialized) {
    await runMqttService(config.mqttTopic);
    console.log(`
     Always open ${captchaPath} on your browser,
     Whenever you receive notification about fill the captcha,
     Then refresh the page with url ${captchaPath},
     And Input the captcha value in the terminal.
    `)
    serviceInitialized = true;
  }
})


