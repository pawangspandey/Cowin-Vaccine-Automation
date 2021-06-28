
/**
 * Prompt questions on terminal
 */

const { getStates, getDistricts } = require('./cowinApi');
const inquirer = require('inquirer');

const askBookingQuestions = async () => {
  let selectedStateID = null;
  let selectedStateName = null;
  let selectedDistrictsName = [];
  let selectedDistrictsIds = [];
  let selectedPincodes = [];
  let minimumAge = 18;

  const { mobileNumber, minimumSlotRequired, districtWiseORPincodeWise, minimumAgeGroup, vaccinePreference, doseNumber,  feeType} = await inquirer.prompt([
    {
      type: 'input',
      name: 'mobileNumber',
      message: "Please enter you 10 digit cowin registered mobile number"
    },
    {
      type: 'input',
      name: 'minimumSlotRequired',
      message: "How much slot you want to book in one go? (Default is 1, you can book upto 4 slot)",
      default: 1
    },
    {
      type: 'list',
      name: 'minimumAgeGroup',
      message: "please select age group",
      choices: ["18+ to 44", "45+"]
    },
    {
      type: 'list',
      name: 'doseNumber',
      message: "please select vaccine dose number",
      default: 0,
      choices: ["1", "2"]
    },
    {
      type: 'list',
      name: 'vaccinePreference',
      message: "please select vaccine preference",
      default: 2,
      choices: ["COVAXIN", "COVISHIELD", "ANY"]
    },
    {
      type: 'list',
      name: 'feeType',
      message: "please select vaccine fee type",
      default: 2,
      choices: ["Free", "Paid", "Any"]
    },
    {
      type: 'list',
      name: 'districtWiseORPincodeWise',
      message: "Geographical how you want to book the available vaccine?",
      default: 0,
      choices: ["pincode wise", "district wise"]
    }
  ]);

  if (minimumAgeGroup == "45+") {
    minimumAge = 45;
  }


  if (districtWiseORPincodeWise == "district wise") {
    // asking for state
    const stateResponse = await getStates();
    const states = stateResponse.data.states;
    const { selectedState } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedState',
        message: "Please select your state",
        choices: states.map(v => v.state_name)
      }
    ]);
    selectedStateName = selectedState
    selectedStateID = states.find((i) => i.state_name == selectedStateName).state_id;

    // asking for districts 
    const districtsResponse = await getDistricts(selectedStateID);
    const districts = districtsResponse.data.districts;

    const { selectedDistricts } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedDistricts',
        message: "Please select your state districts",
        choices: districts.map(v => v.district_name)
      }
    ]);

    selectedDistrictsName = selectedDistricts;
    selectedDistrictsIds = selectedDistrictsName.map(district => districts.find(d => d.district_name == district).district_id);
  }

  if (districtWiseORPincodeWise == "pincode wise") {
    const { pincodes } = await inquirer.prompt([
      {
        type: 'input',
        name: 'pincodes',
        message: "Please enter Comma(,) separated pincode. Example 421003,421503,421501"
      }
    ]);
    selectedPincodes = pincodes.split(',').map(v => v.trim());
  }

  return { 
    mobileNumber,
    minimumSlotRequired,
    districtWiseORPincodeWise,
    selectedStateID,
    selectedStateName,
    selectedDistrictsName,
    selectedDistrictsIds,
    selectedPincodes,
    minimumAge,
    vaccinePreference,
    doseNumber,
     feeType
  };
}

module.exports = askBookingQuestions


