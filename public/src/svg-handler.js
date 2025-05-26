// svg-hander.js
export function initSvgFunctions(config) {
  const {
    settingsUrl,
    roomsUrl,
    containerSelector = "left-wapper",
    toggleBtnSelector = "hidden-position-btn",
  } = config;

  const locationModal = document.createElement("div");
locationModal.id = "location-modal";
locationModal.style.cssText = `
  display: none;
  position: fixed;
  top: 0; left: 0;
  width: 1920px; height: 1080px;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 2000;
  justify-content: center;
  align-items: center;
`;

locationModal.innerHTML = `
  <div style="
    background: white;
    padding: 20px;
    border-radius: 10px;
    width: 300px;
    font-family: Arial;
  ">
    <h3 style="margin-top: 0; color: #007bff;text-align: center">Thêm Vị Trí</h3>
    <form id="location-form">
      <label>Tên phòng:</label>
      <input type="text" name="name" required style="width: 100%; padding: 6px; margin-bottom: 15px; border-radius: 5px; border: 1px solid #ccc;" />
      <div style="text-align: right;">
        <button type="submit" style="margin-right: 10px;width: 60px;height:30px; background-color: green; border :1px solid; border-radius: 5px;position:relative; right:115px"">Lưu</button>
        <button type="button" id="cancel-location-btn" style="margin-right: 5px;width: 60px;height:30px; background-color: red; border :1px solid; border-radius: 5px;position:relative; right:0px">Hủy</button>
      </div>
    </form>
  </div>
`;
document.body.appendChild(locationModal);


  let toggle = localStorage.getItem("positionVisibility") === "true";
  let selectedRoomId = null;
  let isEditMode = false;
  let selectedRoomGroup = null; // Đổi tên để rõ ràng hơn: giữ tham chiếu đến phần tử <g>
  const iframe = document.getElementById(containerSelector);
  const hiddenPosition = document.getElementById(toggleBtnSelector);
  let roomsGroups = []; // Mảng này sẽ lưu trữ các phần tử SVG <g>


  // Lấy trạng thái editMode từ backend
  fetch(settingsUrl)
    .then(res => res.json())
    .then(data => {
      isEditMode = data.editMode;
      console.log("Chế độ chỉnh sửa:", isEditMode);
    })
    .catch(err => console.error("Lỗi khi lấy trạng thái editMode:", err));

  // Hàm chờ iframe và SVG sẵn sàng
  function waitForIframeAndSvg(iframe, callback) {
    const checkReady = () => {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      const svg = doc.querySelector("svg");
      if (svg) {
        callback(doc, svg);
      } else {
        // Nếu SVG chưa có, chờ và kiểm tra lại
        setTimeout(checkReady, 100);
      }
    };

    // Nếu nội dung iframe đã tải, kiểm tra ngay lập tức, nếu không thì chờ sự kiện 'load'
    if (iframe.contentDocument && iframe.contentDocument.readyState === "complete") {
      checkReady();
    } else {
      iframe.addEventListener("load", checkReady);
    }
  }

  // Khởi tạo sau khi SVG sẵn sàng
  waitForIframeAndSvg(iframe, (svgDoc, svgElement) => {
    console.log("SVG và iframe đã sẵn sàng.");
    loadRoomsData(svgElement);
    initializeSvgClickEvent(svgElement);
    initializeDeleteKeyEvent(svgDoc); // Truyền svgDoc để lắng nghe sự kiện trong iframe
  });

  // Tải dữ liệu phòng hiện có và tạo các phần tử SVG
  function loadRoomsData(svgElement) {
    fetch(roomsUrl)
      .then(res => res.json())
      .then(rooms => {
        console.log("Các phòng đã tải:", rooms);
        rooms.forEach(room => createRoomText(svgElement, room));
        // Áp dụng trạng thái hiển thị ban đầu dựa trên 'toggle'
        roomsGroups.forEach(group => {
          group.style.display = toggle ? "block" : "none";
        });
      })
      .catch(err => console.error("Lỗi khi tải dữ liệu phòng:", err));
  }

  // Xử lý sự kiện click trên SVG để thêm phòng mới
  function initializeSvgClickEvent(svgElement) {
  svgElement.addEventListener("click", event => {
    if (!isEditMode) {
      console.log("Không ở chế độ chỉnh sửa. Không thể thêm phòng.");
      return;
    }

    // Lấy tọa độ SVG tương đối với canvas SVG
    const svgPoint = getSvgCoordinates(svgElement, event);

    // Lưu tọa độ tạm thời vào modal để sử dụng sau
    locationModal.dataset.x = svgPoint.x;
    locationModal.dataset.y = svgPoint.y;

    // Hiện modal để nhập tên phòng
    locationModal.style.display = "flex";
  });

  // Xử lý khi submit form trong modal
  const locationForm = document.getElementById("location-form");
  const cancelLocationBtn = document.getElementById("cancel-location-btn");

  locationForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const formData = new FormData(locationForm);
    const name = formData.get("name");
    const x = parseFloat(locationModal.dataset.x);
    const y = parseFloat(locationModal.dataset.y);

    if (!name.trim()) {
      console.log("Tên phòng không được bỏ trống.");
      return;
    }

    const newRoom = { name, x, y };
    saveNewRoom(svgElement, newRoom);

    // Đóng modal và reset form
    locationForm.reset();
    locationModal.style.display = "none";
  });

  cancelLocationBtn.addEventListener("click", () => {
    locationForm.reset();
    locationModal.style.display = "none";
  });
}


  // Lấy tọa độ trong hệ tọa độ SVG
  function getSvgCoordinates(svgElement, event) {
    const point = svgElement.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    // Chuyển đổi tọa độ client sang tọa độ SVG
    return point.matrixTransform(svgElement.getScreenCTM().inverse());
  }

  // Lưu phòng mới vào backend
  function saveNewRoom(svgElement, room) {
    fetch(roomsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(room),
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Lỗi HTTP! trạng thái: ${res.status}`);
        }
        return res.json();
      })
      .then(savedRoom => {
        console.log("Phòng mới đã được lưu:", savedRoom);
        // Tạo phần tử SVG cho phòng vừa được lưu
        createRoomText(svgElement, savedRoom);
      })
      .catch(err => console.error("Lỗi khi lưu phòng mới:", err));
  }

  // Tạo nhóm SVG cho một phòng (icon + text)
  function createRoomText(svgElement, room) {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.dataset.id = room.id; // Lưu ID phòng trên nhóm để dễ dàng truy cập
    group.classList.add("room-group"); // Thêm class để dễ dàng nhắm mục tiêu nếu cần

    const icon = document.createElementNS("http://www.w3.org/2000/svg", "image");
    icon.setAttribute("href", "icon.png"); // Icon placeholder
    icon.setAttribute("x", room.x - 10); // Điều chỉnh vị trí icon so với text
    icon.setAttribute("y", room.y - 30);
    icon.setAttribute("width", "25");
    icon.setAttribute("height", "25"); // Thêm chiều cao để hiển thị tốt hơn

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", room.x);
    text.setAttribute("y", room.y + 10);
    text.setAttribute("fill", "red");
    text.setAttribute("font-size", "12");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-family", "Arial");
    text.setAttribute("font-style", "italic");
    text.textContent = room.name;

    group.addEventListener("click", (event) => {
      if (!isEditMode && group.style.display !== "block") {
        return;
      }
      event.stopPropagation(); // Ngăn chặn sự kiện click SVG cha kích hoạt
      selectRoom(group); // Chọn nhóm, không chỉ phần tử text
    });

    group.appendChild(icon);
    group.appendChild(text);
    svgElement.appendChild(group);
    group.style.display = toggle ? "block" : "none"; // Áp dụng trạng thái hiển thị hiện tại
    roomsGroups.push(group); // Thêm nhóm mới vào mảng
    console.log("Phần tử SVG phòng đã được tạo và thêm:", room.name, room.id);
  }

  // Chọn một nhóm phòng
  function selectRoom(roomGroup) {
    if (selectedRoomGroup) {
      // Xóa highlight khỏi text của nhóm đã chọn trước đó
      const prevText = selectedRoomGroup.querySelector("text");
      if (prevText) {
        prevText.setAttribute("stroke", "none");
      }
    }
    selectedRoomGroup = roomGroup; // Lưu trữ nhóm đã chọn
    selectedRoomId = roomGroup.dataset.id; // Lấy ID từ nhóm

    // Áp dụng highlight cho phần tử text bên trong nhóm vừa chọn
    const currentText = selectedRoomGroup.querySelector("text");
    if (currentText) {
      currentText.setAttribute("stroke", "red");
      currentText.setAttribute("stroke-width", "1");
    }
    console.log("Phòng đã chọn:", selectedRoomId);
  }

  // Xử lý sự kiện phím Delete cho phòng đã chọn
  function initializeDeleteKeyEvent(svgDoc) {
    const handleKey = (e) => {
      // Kiểm tra nếu phím Delete được nhấn, ở chế độ chỉnh sửa, và một phòng đã được chọn
      if (e.key === "Delete" && isEditMode && selectedRoomId && selectedRoomGroup) {
        console.log("Phím Delete được nhấn. Đang cố gắng xóa phòng:", selectedRoomId);
        fetch(`${roomsUrl}/${selectedRoomId}`, {
          method: "DELETE",
        })
          .then(res => {
            if (!res.ok) {
              throw new Error(`Lỗi HTTP! trạng thái: ${res.status}`);
            }
            return res.text(); // Hoặc res.json() nếu DELETE của bạn trả về JSON
          })
          .then(() => {
            console.log("Phòng đã xóa khỏi backend:", selectedRoomId);
            // Xóa phần tử nhóm khỏi DOM
            selectedRoomGroup.remove();
            // Xóa nhóm khỏi mảng roomsGroups
            roomsGroups = roomsGroups.filter(group => group.dataset.id !== selectedRoomId);

            // Đặt lại trạng thái lựa chọn
            selectedRoomId = null;
            selectedRoomGroup = null;
            console.log("Phòng đã xóa khỏi UI và mảng. Số lượng roomsGroups hiện tại:", roomsGroups.length);
          })
          .catch((err) => console.error("Lỗi khi xóa phòng:", err));
      }
    };

    // Lắng nghe sự kiện keydown trên tài liệu chính và tài liệu của iframe
    document.addEventListener("keydown", handleKey);
    // Đảm bảo tài liệu của iframe cũng lắng nghe sự kiện keydown
    // Điều này rất quan trọng vì nếu iframe có focus, tài liệu của nó sẽ nhận các sự kiện phím
    svgDoc.addEventListener("keydown", handleKey);
  }

  // Chuyển đổi hiển thị của tất cả các nhóm phòng
  hiddenPosition.addEventListener("click", () => {
    toggle = !toggle; // Đảo ngược trạng thái 'toggle'
    localStorage.setItem("positionVisibility", toggle); // Lưu trạng thái vào local storage
    console.log("Chuyển đổi hiển thị phòng thành:", toggle);
    // Lặp qua tất cả các nhóm phòng đã lưu và cập nhật kiểu hiển thị của chúng
    roomsGroups.forEach(group => {
      group.style.display = toggle ? "block" : "none";
    });
  });
}
