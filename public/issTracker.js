document.addEventListener("DOMContentLoaded", async function () {
  const viewer = new Cesium.Viewer("cesiumContainer", {
    terrainProvider: await Cesium.createWorldTerrainAsync(),
  });

  // create a starting position for ISS
  const positionProperty = new Cesium.SampledPositionProperty(Cesium.ReferenceFrame.FIXED);
  const issEntity = viewer.entities.add({
    position: positionProperty,
    point: { pixelSize: 10, color: Cesium.Color.RED },
    label: { text: "ISS", font: "14px sans-serif", fillColor: Cesium.Color.WHITE },
  });

  // set initial values to keep ISS image from disappearing
  const initialTime = Cesium.JulianDate.now();
  const initialPosition = Cesium.Cartesian3.fromDegrees(-75.0, 45.0, 400000);
  positionProperty.addSample(initialTime, initialPosition);
  issEntity.position = positionProperty;

  // get ISS Two-Line Element data (encoded orbital data) from API
  async function getISSTLE() {
    try {
      const response = await fetch("https://api.wheretheiss.at/v1/satellites/25544/tles");
      const data = await response.json();
      return { line1: data.line1, line2: data.line2 };
    } catch (error) {
      console.error("Error fetching TLE data:", error);
      return null;
    }
  }

  async function getISSPosition() {
    const tleData = await getISSTLE();
    if (!tleData) return null;

    // use satellite.js to interpret tle data
    const satRec = satellite.twoline2satrec(tleData.line1, tleData.line2);
    const now = new Date();
    const currentTime = satellite.gstime(now);
    const position = satellite.propagate(satRec, now).position;
    if (!position) return null;
    const geodetic = satellite.eciToGeodetic(position, currentTime);

    // convert radians to degrees to get long/lat/altitude
    const longitude = satellite.degreesLong(geodetic.longitude);
    const latitude = satellite.degreesLat(geodetic.latitude);
    const altitude = (geodetic.height + 6378) * 1000; // km into meters

    return { longitude, latitude, altitude };
}

  async function updateISS() {
    const position = await getISSPosition(); // object
    if (!position) {
      console.error("ISS Position is invalid:", position);
      return;
    }

    // convert into cartesian and then update
    const time = Cesium.JulianDate.fromDate(new Date());
    const cartesianPosition = Cesium.Cartesian3.fromDegrees(
      position.longitude,
      position.latitude,
      position.altitude
    );
    positionProperty.addSample(time, cartesianPosition);

    // focus the camera on the ISS
    viewer.trackedEntity = issEntity;

    // update czml to send to datasource to render ISS on screen
    const czml = [
      { id: "document", name: "ISS Tracker", version: "1.0" },
      {
        id: "iss",
        availability: `${Cesium.JulianDate.toIso8601(time)}/9999-12-31T23:59:59Z`,
        position: {
          epoch: Cesium.JulianDate.toIso8601(time),
          cartographicDegrees: [0, position.longitude, position.latitude, position.altitude]
        },
        point: { color: { rgba: [255, 255, 255, 255] }, pixelSize: 10 },
      },
    ];

    // avoid memory issues by clearing before adding
    viewer.dataSources.removeAll();
    viewer.dataSources.add(Cesium.CzmlDataSource.load(czml));
  }

  setInterval(updateISS, 2000);
});
