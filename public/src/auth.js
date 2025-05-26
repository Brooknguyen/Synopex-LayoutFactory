import { setEditModeLocation, setEditModeCamera, setEditModeCabinet } from './settings.js';

export function setupLoginHandler() {
  const loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const username = document.getElementById("uname").value;
    const password = document.getElementById("psw").value;

    if (username === "admin" && password === "1234") {
      alert("Login successful!");
      document.getElementById('id01').style.display = 'none';

      if (window.editTarget === 'camera') {
        setEditModeCamera(true).then(() => location.reload());
      }
      else if (window.editTarget === 'location') {
        setEditModeLocation(true).then(() => location.reload());
      }
      else {
        setEditModeCabinet(true).then(() => location.reload());
      }
    } else {
      alert("Invalid username or password.");
      // Optional: reset cả 2 về false
      setEditModeLocation(false);
      setEditModeCamera(false);
      setEditModeCabinet(false);
      location.reload();
    }
  });
}
