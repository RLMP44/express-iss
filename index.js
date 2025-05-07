import express from "express";
import axios from "axios";
import path from 'path';
import { dirname } from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import countryCodes from "./country_codes.json" assert { type: "json" };

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;
var satelliteData = {};
var locData = {};
var countryName = "";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function handleLocData(code) {
  const country = countryCodes.codes.find((c) => c.Code === code);
  return (country && country.Code !== "??") ? country.Name : "an ocean";
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
    return res.render("index.ejs", { data: satelliteData, loc: locData, name: countryName });
  }
  res.render("index.ejs", { data: satelliteData, loc: locData, name: countryName });
})

app.listen(port, () => {
  console.log('working');
});
