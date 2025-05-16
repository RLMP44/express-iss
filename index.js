import express, { application } from "express";
import axios from "axios";
import path from 'path';
import { dirname } from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import countryCodes from "./data/country_codes.json" assert { type: "json" };
import expressLayouts from "express-ejs-layouts";
import fs from "fs";
import schedule from "node-schedule";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;
var satelliteData = {};
var locData = {};
var countryName = "";

// Set EJS as the template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Enable EJS layouts middleware
app.use(expressLayouts);
app.set("layout", "layout");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function handleLocData(code) {
  const country = countryCodes.codes.find((c) => c.Code === code);
  return (country && country.Code !== "??") ? country.Name : "the ocean";
}

// scheduled job: call API listing people in space & filter for ISS astronauts
async function prepAstroNames() {
  try {
    const response = await axios.get("https://corquaid.github.io/international-space-station-APIs/JSON/people-in-space.json");
    const preliminaryAstroData = response.data.people.filter(person => person.iss === true);
    fs.writeFile("./data/astronautsData.json", JSON.stringify(preliminaryAstroData, null, 2), (error) => {
      if (error) throw error;
      console.log("astroData file has been saved!");
    });
  } catch (error) {
    console.error("Error fetching data:", error.message);
  }
};

// scheduled job: use ISS astronaut names to get bios and stats from space devs API
async function prepAstroBios() {
  try {
    const astronautAPIEndpoint = 'https://ll.thespacedevs.com/2.3.0/astronauts';
    const devAPIEndpoint = 'https://lldev.thespacedevs.com/2.3.0/astronauts'
    const astronautsData = getAstronautData();
    const preliminaryAstroBios = await Promise.all(
      astronautsData.map(async (person) => {
        const peopleResponse = await axios.get(devAPIEndpoint + `/?search=${person.name}`);
        return peopleResponse.data.results;
      })
    );
    fs.writeFile("./data/astronautBios.json", JSON.stringify(preliminaryAstroBios.flat(), null, 2), (error) => {
      if (error) throw error;
      console.log("astroBios file has been saved!");
    });
  } catch (error) {
    console.error("Error fetching data:", error.message);
  }
};

function getAstronautData() {
  const data = fs.readFileSync("./data/astronautsData.json", "utf-8");
  return JSON.parse(data);
}

function getAstronautBios() {
  const data = fs.readFileSync("./data/astronautBios.json", "utf-8");
  return JSON.parse(data);
}

app.get('/', async (req, res) => {
  try {
    // Track the ISS
    const response = await axios.get("https://api.wheretheiss.at/v1/satellites/25544");
    satelliteData = response.data;
    // Use ISS coordinates to get country code and change into country name
    const locResponse = await axios.get(`https://api.wheretheiss.at/v1/coordinates/${satelliteData.latitude},${satelliteData.longitude}`);
    countryName = (handleLocData(locResponse.data.country_code));
    locData = locResponse.data;
  } catch (error) {
    console.error("Error fetching data:", error.message);
    return res.render("index.ejs", { layout: "layout", data: satelliteData, loc: locData, name: countryName });
  }
  res.render("index.ejs", { layout: "layout", data: satelliteData, loc: locData, name: countryName });
})

app.get('/astronauts', async (req, res) => {
  try {
    var astronautsData = getAstronautData();
    var astronautBios = getAstronautBios();
    // Set up first card for carousel
    const firstCardData = {
      name: 'first card',
      displayMessage: `There are currently ${astronautsData.length} astronauts aboard the ISS!`,
      scrollMessage: 'Scroll right to learn all about them!'
    }
    astronautsData.unshift(firstCardData);
    res.render("astronauts.ejs", { layout: "layout", data: astronautsData, profiles: astronautBios });
  } catch (error) {
    console.error("Error fetching data:", error.message);
  }
})

app.listen(port, () => {
  console.log('working');
});

schedule.scheduleJob('0 6 * * *', prepAstroNames);
schedule.scheduleJob('0 6 * * *', prepAstroBios);
