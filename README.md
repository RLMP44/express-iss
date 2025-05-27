A fun project for my astro-loving nieces.
It uses three APIs to track the current location of the ISS and retrieve information about the incredible people aboard it.
Live ISS location tracking is displayed over an interactive and highly detailed Cesium.js globe.
Meanwhile, all astronaut stats are displayed over a planetary background of 100 moving circles (made by yours truly) to bring the space alive while not clogging up the view.

APIs in use:
 - https://wheretheiss.at/w/developer
 - https://github.com/corquaid/international-space-station-APIs?tab=readme-ov-file
 - https://thespacedevs.com/llapi

![image](https://github.com/user-attachments/assets/526ccb44-aa4f-4b3a-b00b-fbd440015cfe)
![image](https://github.com/user-attachments/assets/88ac7c1c-e85c-4501-9267-c7b85b950e17)
![image](https://github.com/user-attachments/assets/2d4aef91-e61a-41be-b721-65df449ba2ce)


Also in use:
- Scheduler - to update the Astronauts in space and their profiles daily
- Websocket - to update the ISS location and stats every 1.5 seconds


