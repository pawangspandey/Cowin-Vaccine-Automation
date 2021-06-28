const MQTT = require("async-mqtt");
const { writeOtp } = require("./otpManager")
const clientId = Math.random().toString(36).substr(2, 9);
let client;


const onMessage = async (topic, message) => {
  try {
    message = message.toString();
    let otpRegex = /CoWIN\sis\s(\d+)\./g;
    otp = otpRegex.exec(message)[1];
    console.log("received otp", otp);
    await writeOtp(otp);
  }
  catch (e) {
    console.log("Got Error While extracting otp");
  }
}

const connectMqtt = async () => {
  client = await MQTT.connectAsync("tcp://test.mosquitto.org", {
    clientId
  });

  client.on("message", onMessage);
}



const subscribe = async (topic) => {
  await client.subscribe(topic);
}


module.exports = {
  connectMqtt,
  subscribe
}
