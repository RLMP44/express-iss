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
import { createServer } from "http";
import { Server } from "socket.io";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;
const server = createServer(app);
const io = new Server(server);
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

// display ISS location as country name or generalized 'ocean'
function handleLocData(code) {
  const country = countryCodes.codes.find((c) => c.Code === code);
  return (country && country.Code !== "??") ? country.Name : "the ocean";
}

// scheduled job (daily): call API listing people in space & filter for ISS astronauts
async function prepAstroNames() {
  try {
    const response = await axios.get("https://corquaid.github.io/international-space-station-APIs/JSON/people-in-space.json");
    const preliminaryAstroData = response.data.people.filter(person => person.iss === true);
    await fs.promises.writeFile("./data/astronautsData.json", JSON.stringify(preliminaryAstroData, null, 2));
    console.log("astroData file has been saved!");
  } catch (error) {
    console.error("Error fetching data:", error.message);
  }
};

// scheduled job (daily): use ISS astronaut names to get bios and stats from space devs API
async function prepAstroBios() {
  try {
    const astronautAPIEndpoint = 'https://ll.thespacedevs.com/2.3.0/astronauts';
    const devAPIEndpoint = 'https://lldev.thespacedevs.com/2.3.0/astronauts'
    const astronautsData = getAstronautData();
    const preliminaryAstroBios = await Promise.all(
      astronautsData.map(async (person) => {
        const peopleResponse = await axios.get(astronautAPIEndpoint + `/?search=${person.name}`);
        return peopleResponse.data.results;
      })
    );
    await fs.promises.writeFile("./data/astronautBios.json", JSON.stringify(preliminaryAstroBios.flat(), null, 2));
    console.log("astroBios file has been saved!");
  } catch (error) {
    console.error("Error fetching data:", error.message);
  }
};

async function getAstronautData() {
  try {
    const data = await fs.promises.readFile("./data/astronautsData.json", "utf-8");
    const parsedData = JSON.parse(data);
    // prevent errors if data is not in an array, without overwriting any existing data
    return Array.isArray(parsedData) ? parsedData : [];
  } catch (error) {
    console.error("Error reading astronaut data:", error.message);
    return [];
  }
}

async function getAstronautBios() {
  try {
    const data = await fs.promises.readFile("./data/astronautBios.json", "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading astronaut bios:", error.message);
    return [];
  }
}

async function getISSCoordinates() {
  try {
    const response = await axios.get("https://api.wheretheiss.at/v1/satellites/25544/");
    return response.data;
  } catch (error) {
    console.error("Error fetching ISS coordinates:", error.message);
    return countryName;
  }
}

// uses lat and lon from ISS coordinates function
async function getCountryName(coordinates) {
  if (!coordinates.lat || !coordinates.lon) {
    console.warn("Invalid coordinates received:", coordinates);
    return "an unknown location";
  }

  try {
    const locResponse = await axios.get(`https://api.wheretheiss.at/v1/coordinates/${coordinates.lat},${coordinates.lon}`);
    locData = locResponse.data;
    return handleLocData(locResponse.data.country_code);
  } catch (error) {
    console.error("Error fetching country name:", error.message);
    return "an unknown location";
  }
}

app.get('/', async (req, res) => {
  try {
    // Initial ISS tracking
    satelliteData = await getISSCoordinates();
    // Use initial ISS coordinates to get initial country code and change into country name
    countryName = await getCountryName({ lat: satelliteData.latitude, lon: satelliteData.longitude });
  } catch (error) {
    console.error("Error fetching data:", error.message);
  }
  // render with newly saved data if no error and previously saved data otherwise
  res.render("index.ejs", { layout: "layout", data: satelliteData, loc: locData, name: countryName, accessToken: process.env.CESIUM_ACCESS_TOKEN, excludeBackground: true });
})

app.get('/astronauts', async (req, res) => {
  try {
    var astronautsData = await getAstronautData();
    var astronautBios = await getAstronautBios();
    // Set up first card for carousel
    const firstCardData = {
      name: 'first card',
      displayMessage: `There are currently ${astronautsData.length} astronauts aboard the ISS!`,
      scrollMessage: 'Scroll right to learn all about them!'
    }
    astronautsData.unshift(firstCardData);
  } catch (error) {
    console.error("Error fetching data:", error.message);
  }
  res.render("astronauts.ejs", { layout: "layout", data: astronautsData, profiles: astronautBios });
})

// use websocket to continuously update satellite data and country name every 1.5 sec
setInterval(async () => {
  const satelliteData = await getISSCoordinates();
  const countryName = await getCountryName({ lat: satelliteData.latitude, lon: satelliteData.longitude});
  const timezone = locData.timezone_id;
  io.emit("issUpdate", satelliteData, countryName, timezone)
}, 1500);

server.listen(port, () => {
  console.log('working');
});

// use scheduler to update astronaut names and bios every morning at 6
schedule.scheduleJob('0 6 * * *', prepAstroNames);
schedule.scheduleJob('5 6 * * *', prepAstroBios);
