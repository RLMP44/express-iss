import express from "express";
import axios from "axios";
import path from 'path';
import { dirname } from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import countryCodes from "./country_codes.json" assert { type: "json" };
import astronautsInSpace from "./astros.json" assert { type: "json" };
import expressLayouts from "express-ejs-layouts";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;
var satelliteData = {};
var locData = {};
var countryName = "";
var astronautsData = {};
var astronautBios = {};

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

function getISSAstronautData(astronauts) {
  const names = [];
  astronauts.forEach((astronaut) => {
    if (astronaut.craft === "ISS") {
      names.push(astronaut.name);
  }});
  return {
    peopleNo: names.length,
    people: names
  };
}

app.get('/', async (req, res) => {
  try {
    const response = await axios.get("https://api.wheretheiss.at/v1/satellites/25544");
    satelliteData = response.data;
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
    // const response = await axios.get("http://api.open-notify.org/astros.json");
    // astronautsData = getISSAstronautData(response.data.people);
    astronautsData = getISSAstronautData(astronautsInSpace.people);
    // Run API requests for each astronaut in parallel
    const astronautAPIEndpoint = 'https://ll.thespacedevs.com/2.3.0/astronauts';
    const devAPIEndpoint = 'https://lldev.thespacedevs.com/2.3.0/astronauts'
    astronautBios = await Promise.all(
      astronautsData.people.map(async (person) => {
        const peopleResponse = await axios.get(devAPIEndpoint + `/?search=${person}`);
        return peopleResponse.data.results;
      })
    );
    console.log(astronautBios);
  } catch (error) {
    console.error("Error fetching data:", error.message);
    return res.render("astronauts.ejs", { layout: "layout", data: astronautsData, profiles: astronautBios });
  }
  res.render("astronauts.ejs", { layout: "layout", data: astronautsData, profiles: astronautBios[0] });
})

app.listen(port, () => {
  console.log('working');
});
