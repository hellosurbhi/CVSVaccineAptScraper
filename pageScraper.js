const player = require("play-sound")();
const fs = require("fs");
const Twitter = require("twitter-lite");
const config = require("./config");
const zips = require("./json/zips.json");
const stateSelectors = require("./json/stateSelectors.json");
const { GoogleSpreadsheet } = require("google-spreadsheet");

const doc = new GoogleSpreadsheet(
  "10SnHpQwaspZ8XWpsq1cEThYvKfCQjoD1GV_AAiImOKM"
);

const client = new Twitter(config);

// inputs
const age = "18";
const startingI = 0;
const currentState = "Puerto Rico";
const stateSelector = stateSelectors.find((x) => x.state === currentState)
  .selector;

const zipcodes = zips.filter(function (e) {
  return e.state === currentState;
});

console.log(zipcodes);

const scraperObject = {
  url:
    "https://www.cvs.com/immunizations/covid-19-vaccine?icid=cvs-home-hero1-link2-coronavirus-vaccine",
  async scraper(browser) {
    await doc.useServiceAccountAuth(require("./creds-from-google.json"));
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    }

    function wait() {
      return getRandomInt(1000, 2500);
    }

    function newPageWait() {
      return getRandomInt(4000, 8000);
    }

    function timeoutWait() {
      return getRandomInt(8000, 10000);
    }

    function typeDelay() {
      return getRandomInt(150, 400);
    }

    let page = (await browser.pages())[0];
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

    console.log(`Navigating to ${this.url}...`);
    await page.goto(this.url);
    await page.waitForTimeout(timeoutWait());

    async function checkForSelector(selector, errorMessage) {
      try {
        await page.waitForSelector(selector, { timeout: timeoutWait() });
        await clickButton(selector, "selector " + selector + " found");
      } catch (error) {
        console.log(errorMessage);
      }
    }

    async function typeText(selector, input, id) {
      try {
        await page.waitForTimeout(wait());
        await page.focus(selector);
        await page.type(selector, input, { delay: typeDelay() });
        await page.waitForTimeout(wait());
        console.log(`${id} input typed in`);
      } catch (err) {
        console.log(`${id} input not found`, err);
        player.play("./media/roadrunner.mp3", (err) => {
          if (err) console.log(`Could not play sound: ${err}`);
        });
      }
    }

    async function clearText(selector) {
      await page.waitForTimeout(wait());
      await page.evaluate((selector) => {
        document.querySelector(selector).value = "";
      }, selector);
    }

    async function clickButton(selector, id) {
      await page.waitForTimeout(wait());
      try {
        console.log(`${id} button pressed`);
        await page.click(selector);
      } catch (err) {
        console.error(`${id} button not found`, err);
        player.play("./media/roadrunner.mp3", (err) => {
          if (err) console.log(`Could not play sound: ${err}`);
        });
      }
    }

    async function clickNextPage(selector, id) {
      await page.waitForTimeout(wait());
      try {
        console.log(`${id} clicked, moved to next page`);
        await page.click(selector);
      } catch (err) {
        console.error(`${id} not found`, err);
        player.play("./media/roadrunner.mp3", (err) => {
          if (err) console.log(`Could not play sound: ${err}`);
        });
      }
      await page.waitForTimeout(newPageWait());
      await checkForSelector("#acsFocusFirst", "Popup didn't appear.");
    }

    await clickNextPage(
      "#acc_3 > div > div.content__wrapper.parsecondary > div > div.bodytext.aem-GridColumn--default--none.aem-GridColumn.aem-GridColumn--default--8.aem-GridColumn--offset--md--0.aem-GridColumn--offset--default--2.aem-GridColumn--md--none.aem-GridColumn--md--12 > div > div > div > div > div > div.textonly__text.body__copy > div > p:nth-child(2) > a",
      "Get to past two weeks questionnaire"
    );

    await clickButton(
      "#questionnaire > fieldset > section > div:nth-child(3) > fieldset > div.radio-btn-wrapper.answer-wrapper.flex-dir-col > div:nth-child(2)",
      "Past two weeks questionnaire Q1"
    );

    await clickButton(
      "#questionnaire > fieldset > section > div:nth-child(4) > fieldset > div.radio-btn-wrapper.answer-wrapper.flex-dir-col > div:nth-child(2)",
      "Past two weeks questionnaire Q1"
    );

    await clickButton(
      "#questionnaire > fieldset > section > div:nth-child(5) > fieldset > div.radio-btn-wrapper.answer-wrapper.flex-dir-col > div:nth-child(2)",
      "Past two weeks questionnaire Q3"
    );

    await clickNextPage(
      "#content > div.footer-content-wrapper > button",
      "first continue button"
    );

    await clickButton(
      "#generic > section > div.form-group > div > div > div:nth-child(1)",
      "start vaccination"
    );

    await clickNextPage(
      "#content > div.footer-content-wrapper > button",
      "continue scheduling button"
    );

    await page.waitForTimeout(wait());
    await page.select("#jurisdiction", stateSelector);

    await clickNextPage(
      "#content > div.footer-content-wrapper > button",
      "click next button"
    );

    await typeText("#q1_0", age, "enter age");

    await clickButton(
      "#generic > fieldset > section > div:nth-child(5) > div > div > div:nth-child(2)",
      "click 16 and above with conditions"
    );

    await clickButton(
      "#generic > fieldset > section > div:nth-child(6)",
      "click affirm"
    );

    await clickNextPage(
      "#content > div.footer-content-wrapper > button",
      "to next page"
    );

    await clickNextPage(
      "#content > div.footer-content-wrapper > button",
      "start scheduling"
    );
    let tweetedAddressObject = {};

    for (let i = startingI; i < zipcodes.length; i++) {
      let currentZipcode = zipcodes[i]["zipcode"];
      let consoleMessage = `at ${currentZipcode}`;
      await typeText("#address", currentZipcode, consoleMessage);
      await page.waitForTimeout(wait());
      await clickNextPage(
        "#generic > div > div > div.flex-container > button",
        "searching for appointments"
      );
      await page.waitForTimeout(wait());
      let availableAppoinments = await page.evaluate(() => {
        let el = document.querySelector("#availableDate");
        return el ? true : false;
      });

      if (availableAppoinments) {
        console.log("Appointments are available!");

        async function checkForMoreAppointments() {
          await page.waitForTimeout(wait());
          let loadNextSelector = await page.evaluate(() => {
            let el = document.querySelector(
              "#content > div.main-content-wrapper > cvs-store-locator > div > div > div.see-more-locations > button"
            );
            return el ? true : false;
          });
          if (!loadNextSelector) {
            return;
          } else {
            await page.waitForTimeout(wait());
            await clickButton(
              "#content > div.main-content-wrapper > cvs-store-locator > div > div > div.see-more-locations > button",
              "check for more locations"
            );
            return checkForMoreAppointments();
          }
        }

        await checkForMoreAppointments();

        let loadNextSelector = await page.evaluate(() => {
          let el = document.querySelector(
            "#content > div.main-content-wrapper > cvs-store-locator > div > div > div.see-more-locations > button"
          );
          return el ? true : false;
        });
        if (loadNextSelector) {
          await clickButton(loadNextSelector, "check for more locations");
        }
        let result = await page.evaluate(() => {
          let resultArray = [];
          let addresses = document.querySelectorAll(
            "#clinic-address-detail > address"
          );
          for (let address of addresses) {
            let object = {};
            let pharmacyName = address.children[0].innerText;
            let pharmacyAddress = address.children[1].innerText;
            let availableDate = address.children[2].innerText;
            let vaccine = address.children[3].innerText
              .replace(/Vaccine:/, "")
              .trim();

            object = {
              pharmacyName: pharmacyName,
              pharmacyAddress: pharmacyAddress,
              availableDate: availableDate,
              vaccine: vaccine,
            };
            resultArray.push(object);
          }
          return resultArray;
        });
        console.log(result);
        for (let j = 0; j < result.length; j++) {
          fs.appendFile(
            "./logs.txt",
            JSON.stringify(result[j]) + "\n",
            "utf-8",
            function (err) {
              if (err) throw err;
            }
          );
          let vaccineName = result[j].vaccine.substr(
            0,
            result[j].vaccine.indexOf(" ")
          );
          let resultingAreaName = result[j].pharmacyAddress
            .substr(0, result[j].pharmacyAddress.indexOf(","))
            .replace(" ", "")
            .toLowerCase();
          let pharmacyName = result[j].pharmacyName;
          let cityName = zipcodes[i]["city"].replace(" ", "");
          let tweetContent = `${result[j].vaccine} vaccine available at CVS Pharmacy ${pharmacyName} ${result[j].pharmacyAddress} on ${result[j].availableDate}. Schedule here: https://www.cvs.com/vaccine/intake/store/cvd-schedule?icid=cvd_bstr_only #${vaccineName} #${cityName} #${resultingAreaName} #${currentState} #Covid #Vaccine #Appointments #vaccinebot`;

          let googleObject = {
            pharmacyName: pharmacyName,
            pharmacyAddress: result[j].pharmacyAddress,
            availableDate: result[j].availableDate,
            vaccine: vaccineName,
            zipcodeSearched: currentZipcode,
            city: zipcodes[i]["city"],
            state: currentState,
            dateSearched: Date.now(),
          };

          await sheet.addRow(googleObject);

          if (!tweetedAddressObject.hasOwnProperty(pharmacyName)) {
            tweetedAddressObject[pharmacyName] = true;
            client
              .post("statuses/update", { status: tweetContent })
              .then((result) => {
                console.log(
                  'You successfully tweeted this : "' + result.text + '"'
                );
                player.play("./media/success.wav", (err) => {
                  if (err) console.log(`Could not play sound: ${err}`);
                });
              })
              .catch(console.error);
            await page.waitForTimeout(wait());
          } else {
            console.log("Already tweeted about this CVS");
          }
        }
        await clearText("#address");
      } else {
        await page.waitForTimeout(wait());
        console.log("No appointments available");
        await clearText("#address");
      }
    }
    //Program successfully completed
    // await browser.close();
    console.log("Program completed!");
    tweetedAddressObject = {};
  },
};

module.exports = scraperObject;
