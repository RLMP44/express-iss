document.addEventListener("DOMContentLoaded", async function () {
  const viewer = new Cesium.Viewer("cesiumContainer", {
    terrainProvider: await Cesium.createWorldTerrainAsync(),
  });

  var issPosition = {};

  // create a starting position for ISS
  const issEntity = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(-103.0, 40.0),
    height: 250000,
    billboard: {
      image: "/images/ISS.png",
      width: 32,
      height: 32,
    },
    label: {
      text: "ISS",
      font: "14pt monospace",
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 3,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -9),
    },
  });

  // set up name and description for info box available on entity click
  issEntity.name = "ISS";
  issEntity.description =
    '\
  <img\
    width="50%"\
    style="float:left; margin: 0 1em 1em 0;"\
    src="/images/ISS-scaled.jpeg"/>\
  <p>\
    AKA the International Space Station \
  </p>\
  <p>\
    The International Space Station (ISS) is a large space station \
    that was assembled and is maintained in low Earth orbit \
    by a collaboration of five space agencies and their contractors:\
    NASA (United States), Roscosmos (Russia), ESA (Europe), \
    JAXA (Japan), and CSA (Canada). \
    As the largest space station ever constructed, \
    it primarily serves as a platform for conducting scientific experiments \
    in microgravity and studying the space environment.\
  </p>\
  <p>\
    Source: \
    <a style="color: WHITE"\
      target="_blank"\
      href="https://en.wikipedia.org/wiki/International_Space_Station">Wikpedia</a>\
  </p>';

  async function getISSCoordinates() {
    try {
      const response = await fetch("https://api.wheretheiss.at/v1/satellites/25544/");
      const data = await response.json();
      return { longitude: data.longitude, latitude: data.latitude, altitude: data.altitude };
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      return null;
    }
  }

  async function updateISS() {
    const position = await getISSCoordinates(); // object
    if (!position) {
      console.error("ISS Position is invalid:", position);
      return;
    }
    issPosition = position;

    // set iss entity position anc convert km to meters
    issEntity.position = Cesium.Cartesian3.fromDegrees(position.longitude, position.latitude, position.altitude * 1000);
    viewer.trackedEntity = issEntity;
  }

  function updateCamera() {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(issPosition.longitude, issPosition.latitude, 2500000),
      orientation: {
        heading: Cesium.Math.toRadians(20.0),
        pitch: Cesium.Math.toRadians(-90.0),
        roll: 0.0,
      },
    })
  }

  setInterval(updateISS, 1500);
  setTimeout(function() {
    if (issPosition.longitude && issPosition.latitude) {
      updateCamera();
    } else {
      console.warn("ISS position not available yet!");
    }
  }, 2000);
});
