// TODO: 
// 1. Pincode wise all the availabity check
// 2. If available
//     => Sort it by desending order
//     => Match for maximu
//     => Book for the session


const axios = require('axios').default;
const _ = require('lodash');
const Promise = require('bluebird');
const moment = require('moment');
const unwind = require('javascript-unwind');
const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36";
const delay = (time = 100) => new Promise((res) => {
  setTimeout(res, time);
});

const doRequest = ({
  method,
  resource,
  data = null,
  headers = {}
}) => {
  Object.assign(headers, {
    'User-Agent': userAgent,
    "Accept": "*/*",
    "Connection": "keep-alive",
    "Accept-Encoding": "gzip, deflate, br"
  })
  console.log()
  return axios({
    method,
    url: resource,
    data,
    headers
  });
};

const getPinWiseSessionAvailable = async (pins) => {
  const availableCenters = [];
  await Promise.all(pins)
    .mapSeries(async (pin) => {
      let currentDate = moment();
      if (currentDate.hour() > 7) {
        currentDate = currentDate.add(1, "days");
      }
      let allAvailableCenters = [];
      let centers = await findAllNextSessions({ pin, date: currentDate.format("DD-MM-YYYY") })
      allAvailableCenters.push(centers);
      while (centers.length > 0) {
        currentDate = currentDate.add(7, "days")
        centers = await findAllNextSessions({ pin, date: currentDate.format("DD-MM-YYYY") })
        allAvailableCenters.push(centers);
      }
      return [].concat.apply([], allAvailableCenters);
    })
    .then((result) => [].concat.apply([], result))
    .map(center => {
      let availableSessions = [];
      if (center.sessions) {
        availableSessions = center.sessions.filter(s => s.available_capacity > 0);
      }
      if (availableSessions.length > 0) {
        // check for max capacity
        availableSessions = _.orderBy(availableSessions, ['available_capacity'], ['desc']);
        availableCenters.push(Object.assign({}, center, {
          availableSessions,
          maxCapSession: availableSessions[0]
        }));
      }
    })

  return availableCenters;
};


const findAllNextSessions = async ({ pin, date }) => {

  console.log(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=${pin}&date=${date}`);
  await delay(500);
  const sessionsData = await axios.get(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin?pincode=${pin}&date=${date}`, {
    headers: {
      'User-Agent': userAgent
    }
  })
  return sessionsData.data.centers;
}




const getPinWiseSessionAvailablePrivate = async (pins, auth) => {
  return await Promise.all(pins)
    .mapSeries(async (pin) => {
      let currentDate = moment();
      if (currentDate.hour() > 7) {
        currentDate = currentDate.add(1, "days");
      }
      let nextAvailable = true;
      let allAvailableCenters = []
      while (nextAvailable) {
        let centers = await findAllNextSessionsPinWise({ pin, date: currentDate.format("DD-MM-YYYY"), auth });
        allAvailableCenters.push(centers);
        nextAvailable = centers.length > 0;
        currentDate = currentDate.add(7, "days");
      }
      return [].concat.apply([], allAvailableCenters);
    })
    .then((result) => [].concat.apply([], result))
    .then(result => {
      return unwind(result, "sessions")
    })
}

const findAllNextSessionsPinWise = async ({ pin, date, auth }) => {
  console.log(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByPin?pincode=${pin}&date=${date}`);
  await delay(500);
  const sessionsData = await doRequest({
    method: "GET",
    resource: `https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByPin?pincode=${pin}&date=${date}`,
    headers: {
      "Authorization": `Bearer ${auth.userToken}`
    }
  })
  return sessionsData.data.centers;
}


const getDistrictWiseSessionAvailablePrivate = async (districts, auth) => {
  return await Promise.all(districts)
    .mapSeries(async (district) => {
      let currentDate = moment();
      if (currentDate.hour() > 7) {
        currentDate = currentDate.add(1, "days");
      }
      let nextAvailable = true;
      let allAvailableCenters = []
      while (nextAvailable) {
        let centers = await findAllNextSessionsDistrictWise({ district, date: currentDate.format("DD-MM-YYYY"), auth });
        allAvailableCenters.push(centers);
        nextAvailable = centers.length > 0;
        currentDate = currentDate.add(7, "days");
      }
      return [].concat.apply([], allAvailableCenters);
    })
    .then((result) => [].concat.apply([], result))
    .then(result => {
      return unwind(result, "sessions")
    })
}

const findAllNextSessionsDistrictWise = async ({ district, date, auth }) => {
  console.log(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=${district}&date=${date}`);
  await delay(500);
  const sessionsData = await doRequest({
    method: "GET",
    resource: `https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=${district}&date=${date}`,
    headers: {
      "Authorization": `Bearer ${auth.userToken}`
    }
  })
  return sessionsData.data.centers;
}



const getBeneficiaries = async (auth) => {
  return await doRequest({
    method: "GET",
    resource: "https://cdn-api.co-vin.in/api/v2/appointment/beneficiaries",
    headers: {
      "Authorization": `Bearer ${auth.userToken}`
    }
  })
}

const bookAppointment = async (data, auth) => {
  return await doRequest({
    method: "POST",
    resource: "https://cdn-api.co-vin.in/api/v2/appointment/schedule",
    data,
    headers: {
      "Authorization": `Bearer ${auth.userToken}`
    }
  })
}

const getCaptcha = async (data = {}, auth) => {
  return await doRequest({
    method: "POST",
    resource: "https://cdn-api.co-vin.in/api/v2/auth/getRecaptcha",
    data,
    headers: {
      "Authorization": `Bearer ${auth.userToken}`
    }
  })
}

const getStates = async () => {
  return await doRequest({
    method: "GET",
    resource: "https://cdn-api.co-vin.in/api/v2/admin/location/states"
  });
}


const getDistricts = async (stateId) => {
  return await doRequest({
    method: "GET",
    resource: `https://cdn-api.co-vin.in/api/v2/admin/location/districts/${stateId}`
  });
}


module.exports = {
  getPinWiseSessionAvailable,
  getBeneficiaries,
  bookAppointment,
  getCaptcha,
  getStates,
  getDistricts,
  getPinWiseSessionAvailablePrivate,
  getDistrictWiseSessionAvailablePrivate
};
