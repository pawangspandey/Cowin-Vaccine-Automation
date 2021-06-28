# Cowin Vaccine Automation

## Why there is need to automate the vacchine booking?
As working professionals, we don't get a chance to constantly look on to Cowin website and book for the session of vaccine if available as per our prefered geographical areas.

Secondly, there is a lot of things to do in order to book a slot (like login into the website search for the vaccine then book if the session is available), also the Cowin site has removed the feature where one can directly book for up to 4 slots in one go.

This is very much to do and has lots of competition among the population group (mostly 18+) and chances of the booking the available session may missed out due to the lots of manual work.

## How to setup the automation?
You first need to install some automation dependency.

### Automation App Dependencies.
* **Cowin Registered Mobile Number**: You need register yourself on https://selfregistration.cowin.gov.in/ with mobile numabder and add other beneficiary.

* **Node.js**:  You can follow [this lint](https://nodejs.org/en/download/) to download and install node js.
* **Android App**: The app will read the received Cowin OTP and send it to the automation script (Release and open source SOON)

Once you install all the required App Dependencies, its time to download the automation script, which you can download from this pages download button (Or you can clone this repo in you machine)

After download go to the downloaded folder (you may need to extract first) and then you need to install scripts dependency like:
```sh
npm install
```

Now lets start our automation, this will ask few questions about the vaccine booking.

```sh
node index.js
```

### Automation Prompt Questions:

1. **_Please enter you 10 digit cowin registered mobile number_:**  You need provide your registered mobile number (press enter for confirm and next)

2. **_How much slot you want to book in one go? (Default is 1, you can book upto 4 slot)_:**  You can book slots for all the added beneficiary (upto 4 total) in one go. (press enter for confirm and next)

3. **_please select age group_:**  You need provide select age group for vaccine booking, for selection use SPACE button. its recomanded to add all beneficiary which same age group. (press enter for confirm and next)


4. **_please select vaccine preference_:**  you can choose C
(press enter for confirm and next)

5.




