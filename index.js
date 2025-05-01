import express from "express";
import axios from "axios";

const app = express();
const port = 3000;

var satelliteData = {};
var locData = {};

app.get('/', async (req, res) => {
  try {
    const response = await axios.get("https://api.wheretheiss.at/v1/satellites/25544");
    satelliteData = response.data;
    const locResponse = await axios.get(`https://api.wheretheiss.at/v1/coordinates/${satelliteData.latitude},${satelliteData.longitude}`);
    locData = locResponse.data;
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({ error: "Failed to fetch API data" });
  }
  res.render("index.ejs", { data: satelliteData, loc: locData });
})

https://api.wheretheiss.at/v1/coordinates/37.795517,-122.393693

app.listen(port, () => {
  console.log('working');
});
