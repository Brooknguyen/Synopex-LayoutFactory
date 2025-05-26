export function getToggleVisibility() {
  return localStorage.getItem("toggleVisibility") === "true";
}

export function setToggleVisibility(value) {
  localStorage.setItem("toggleVisibility", value);
}

export function getCameraVisibility() {
  return localStorage.getItem("cameraVisibility") === "true";
}

export function setCameraVisibility(value){
  localStorage.setItem("cameraVisibility", value)
}

export function getCabinetVisibility() {
  return localStorage.getItem("cabinetVisibility") === "true";
}

export function setCabinetVisibility(value){
  localStorage.setItem("cabinetVisibility", value)
}
