import { setupLoginHandler } from './auth.js';
import { initSettingsLocation } from './settings.js';
import { initSvgFunctions } from './svg-handler.js';
import { initCameraFunctions } from './camera-handler.js';
import { initCabinetFunctions } from './cabinet-handler.js';

window.addEventListener("DOMContentLoaded", () => {
  setupLoginHandler();  // Đăng ký sự kiện submit login
  initSettingsLocation(); // Lấy editMode từ server

  initSvgFunctions({
    settingsUrl: "http://10.100.203.78:3006/settings/1",
    roomsUrl: "http://10.100.203.78:3006/1st",
    
  });

  initCameraFunctions({
    settingsUrl: "http://10.100.203.78:3006/settingsCamera/1",
    camerasUrl: "http://10.100.203.78:3006/1stCamera",
  });

  initCabinetFunctions({
    settingsUrl: "http://10.100.203.78:3006/settingsCabinet/1",
    cabinetsUrl: "http://10.100.203.78:3006/1stCabinet",
  })
});

// ⚠️ Thêm biến toàn cục và hàm mở modal
window.editTarget = "location";

window.openEditModal = function (target) {
  window.editTarget = target;
  document.getElementById("id01").style.display = "block";
};
