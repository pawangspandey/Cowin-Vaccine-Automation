const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const moment = require('moment');

const tempDir = path.join(__dirname, '/temp');
const otpFile = path.join(tempDir, '/otp.json');


const readOtpFile = async () => {
  let otps = [];
  try {
    await fse.ensureFile(otpFile);
    otps = await fse.readJSON(otpFile);
  }
  catch (e) {

  }
  return otps;
}


const readReceivedOtp = async (timestamp) => {
  const otps =  await readOtpFile();
  let newOtps = otps.filter(otp => new Date(otp.ts) > new Date(timestamp)) || [];
  if (newOtps.length > 0) {
    newOtps.sort(function (left, right) {
      return moment.utc(left.ts).diff(moment.utc(right.ts))
    });

   return newOtps[newOtps.length - 1].otp;
  }

  return null;
}

const writeOtp = async (otp) => {
  let otps = await readOtpFile();
  otps.push({
    otp,
    ts: moment().toDate()
  });
  return await fse.writeJSON(otpFile, otps);
}


module.exports = {
  readReceivedOtp,
  writeOtp
}