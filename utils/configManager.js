const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');

const tempDir = path.join(__dirname, '/temp');
const configFile = path.join(tempDir, '/config.json');


const isConfigExist = async () => {
  await fse.ensureDir(tempDir);
  try {
    await fse.access(configFile)
    return true
  } catch {
    return false
  }
}

const readConfig = async () => {
  return await fse.readJSON(configFile);
}

const writeConfig = async (config) => {
  await fse.ensureFile(configFile);
  return await fse.writeJSON(configFile, config);
}

module.exports = {
  isConfigExist,
  readConfig,
  writeConfig
}