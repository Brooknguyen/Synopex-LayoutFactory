let isEditMode = false;

export function initSettingsLocation() {
  fetch("http://10.100.203.78:3006/settings/1")
    .then((res) => res.json())
    .then((data) => {
      isEditMode = data.editMode;
    })
    .catch((err) => console.error("Lỗi khi lấy trạng thái editMode:", err));
}

export function getEditMode() {
  return isEditMode;
}

export function setEditModeLocation(value) {
  isEditMode = value;
  return fetch("http://10.100.203.78:3006/settings/1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ editMode: value }),
  }).then((res) => {
    if (!res.ok) throw new Error("Không thể cập nhật editMode location.");
  });
}

export function setEditModeCamera(value) {
  isEditMode = value;
  return fetch("http://10.100.203.78:3006/settingsCamera/1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ editMode: value }),
  }).then((res) => {
    if (!res.ok) throw new Error("Không thể cập nhật editMode camera.");
  });
}

export function setEditModeCabinet(value) {
  isEditMode = value;
  return fetch("http://10.100.203.78:3006/settingsCabinet/1",{
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ editMode: value}),
  }).then((res) => {
    if (!res.ok) throw new Error ("Khong thể cập nhật editMode cabinet.");
  })
}

export function exitEditMode() {
  return Promise.all([
    setEditModeLocation(false),
    setEditModeCamera(false),
    setEditModeCabinet(false)

  ])
    .then(() => {
      alert("Đã thoát chế độ chỉnh sửa.");
      location.reload(); // Tải lại trang để cập nhật trạng thái
    })
    .catch((err) => {
      console.error("Lỗi khi cập nhật trạng thái:", err);
      alert("Không thể thoát chế độ chỉnh sửa.");
    });
}

// Gán để gọi từ HTML onclick
window.exitEditMode = exitEditMode;
