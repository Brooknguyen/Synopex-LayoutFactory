// camera-handler.js
export function initCameraFunctions(config) {
  const {
    settingsUrl,
    camerasUrl,
    containerSelector = "left-wapper",
    toggleBtnSelector = "hidden-camera-btn"
  } = config;

    // === TẠO MODAL CAMERA FORM ===
  const cameraModal = document.createElement("div");
  cameraModal.id = "camera-modal";
  cameraModal.style.cssText = `
    display: none;
    position: fixed;
    top: 0; left: 0;
    width: 1920px; height: 1080px;
    background-color: rgba(0, 0, 0, 0.6);
    z-index: 2000;
    justify-content: center;
    align-items: center;
  `;

  cameraModal.innerHTML = `
    <div style="
      background: white;
      padding: 20px;
      border-radius: 10px;
      width: 300px;
      font-family: Arial;
    ">
      <h3 style="margin-top: 0; color: #007bff;text-align: center">Thêm Camera</h3>
      <form id="camera-form">
        <label>Vị trí camera:</label>
        <input type="text" name="name" required style="width: 100%; padding: 6px; margin-bottom: 10px; border: 1px solid #ccc" />

        <label>Link camera:</label>
        <input type="url" name="link" required style="width: 100%; padding: 6px; margin-bottom: 15px;border-radius:20px; border: 1px solid #ccc" />

        <div style="text-align: right;">
          <button type="submit" style="margin-right: 10px;width: 60px;height:30px; background-color: green; border :1px solid; border-radius: 5px;position:relative; right:125px">Save</button>
          <button type="button" id="cancel-camera-btn" style= "width: 60px;height:30px; background-color: red; border :1px solid; border-radius: 5px;position:relative; right:5px">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(cameraModal);


  let toggle1 = localStorage.getItem("cameraVisibility") === "true";
  let selectedRoomId = null;
  let isEditMode = false;
  let selectedRoomElement = null;
  const iframe = document.getElementById(containerSelector);
  const hiddenCamera = document.getElementById(toggleBtnSelector);
  let cameraGroups = [];

  fetch(settingsUrl)
    .then(res => res.json())
    .then(data => {
      isEditMode = data.editMode;
    })
    .catch(err => console.error("Lỗi khi lấy trạng thái editMode:", err));

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

  function loadRoomsData(svgElement) {
    fetch(camerasUrl)
      .then(res => res.json())
      .then(rooms => {
        rooms.forEach(room => createRoomText(svgElement, room));
        cameraGroups.forEach(group => {
          group.style.display = toggle1 ? "block" : "none";
        });
      });
  }
  
    function initializeSvgClickEvent(svgElement) {
    const form = document.getElementById("camera-form");
    const cancelBtn = document.getElementById("cancel-camera-btn");
    const modal = document.getElementById("camera-modal");

    let svgPoint = null;

    svgElement.addEventListener("click", (event) => {
      if (!isEditMode) return;

      svgPoint = getSvgCoordinates(svgElement, event);
      form.reset();
      modal.style.display = "flex";
    });

    cancelBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const newRoom = {
        name: formData.get("name"),
        link: formData.get("link"),
        x: svgPoint.x,
        y: svgPoint.y,
      };

      modal.style.display = "none";
      saveNewRoom(svgElement, newRoom);
    });
  }


  function getSvgCoordinates(svgElement, event) {
    const point = svgElement.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(svgElement.getScreenCTM().inverse());
  }

  function saveNewRoom(svgElement, room) {
    fetch(camerasUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(room),
    })
      .then(res => res.json())
      .then(savedRoom => createRoomText(svgElement, savedRoom));
  }

  function createRoomText(svgElement, room) {
    const groupElement = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Tạo icon (hình tròn hoặc hình ảnh)
    const iconElement = document.createElementNS("http://www.w3.org/2000/svg", "image"); 
    iconElement.setAttribute("href", "camera.png"); // Đường dẫn đến icon
    iconElement.setAttribute("x", room.x - 10); // Tọa độ x
    iconElement.setAttribute("y", room.y - 30); // Tọa độ y (đặt icon phía trên text)
    iconElement.setAttribute("width", "22"); // Bán kính
    // Màu sắc của icon
    
    // Tạo popup khi hover vào icon
    const popupElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
    popupElement.setAttribute("x", room.x);
    popupElement.setAttribute("y", room.y + 5); // Đặt popup phía trên icon
    popupElement.setAttribute("fill", "red");
    popupElement.setAttribute("font-size", "14");
    popupElement.setAttribute("font-family", "Arial");
    popupElement.setAttribute("font-style", "italic");
    popupElement.setAttribute("text-anchor", "middle");
    popupElement.setAttribute("dominant-baseline", "middle");
    popupElement.textContent = `${room.name}`;
    popupElement.style.display = "none"; // Ẩn popup ban đầu
    // Tạo đường link xem chi tiết
    const linkElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
    linkElement.setAttribute("x", room.x);
    linkElement.setAttribute("y", room.y + 20); // Đặt link phía dưới text room.name
    linkElement.setAttribute("fill", "blue");
    linkElement.setAttribute("font-size", "12");
    linkElement.setAttribute("font-family", "Arial");
    linkElement.setAttribute("text-anchor", "middle");
    linkElement.setAttribute("dominant-baseline", "middle");
    linkElement.style.cursor = "pointer";
    linkElement.style.textDecoration = "underline"; // Gạch chân link
    linkElement.style.display = "none"; // Ẩn link ban đầu
    linkElement.textContent = "Xem chi tiết";

    // Thêm sự kiện click vào link
    linkElement.addEventListener("click", () => {
      // Tạo iframe để mở link camera
      const iframe = document.createElement("iframe");
      iframe.src = room.link;
      iframe.style.width = "800px";
      iframe.style.height = "600px";
      iframe.style.position = "absolute";
      iframe.style.top = "500px";
      iframe.style.left = "950px";
      iframe.style.borderRadius = "10px";
      iframe.style.transform = "translate(-50%, -50%)";
      iframe.style.border = "2px solid black";
      iframe.style.zIndex = "1000";
      iframe.style.backgroundColor = "white";

      // Tạo nút đóng iframe
      const closeButton = document.createElement("button");
      closeButton.textContent = "X";
      closeButton.style.border = "none";
      closeButton.style.fontSize = "19px";
      closeButton.style.color = "red";
      closeButton.style.fontFamily = "Arial";
      closeButton.style.fontWeight = "bold";
      closeButton.style.position = "absolute";
      closeButton.style.top = "210px";
      closeButton.style.left = "1320px";
      closeButton.style.backgroundColor = "transparent";
      closeButton.style.zIndex = "1002"; // Đảm bảo nút button có z-index cao hơn iframe
      closeButton.style.cursor = "pointer";

      // Thêm sự kiện đóng iframe
      closeButton.addEventListener("click", () => {
        document.body.removeChild(iframeContainer);
      });
      // Tạo container chứa iframe và nút đóng
      const iframeContainer = document.createElement("div");
      iframeContainer.style.position = "absolute";

      // Thêm sự kiện click vào icon để xóa nếu đang ở chế độ editMode
      iconElement.addEventListener("click", (event) => {
        if (!isEditMode) return; 
        event.stopPropagation(); // Ngăn chặn sự kiện click lan truyền lên nhóm
        
      });
      iframeContainer.style.top = "0";
      iframeContainer.style.left = "0";
      iframeContainer.style.width = "1920px";
      iframeContainer.style.height = "1080px";
      iframeContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      iframeContainer.style.zIndex = "999";
      iframeContainer.appendChild(iframe);
      iframeContainer.appendChild(closeButton);

      // Thêm container vào body
      document.body.appendChild(iframeContainer);
    });

    // Thêm link vào nhóm
    groupElement.appendChild(linkElement);
    // Thêm sự kiện hover vào icon
    iconElement.addEventListener("mouseenter", () => {
      popupElement.style.display = "block"; // Hiện popup khi hover
      linkElement.style.display = "block"; // Hiện link khi hover
    });

    groupElement.addEventListener("mouseleave", () => {
      popupElement.style.display = "none"; // Ẩn popup khi rời hẳn khỏi nhóm
      linkElement.style.display = "none"; // Ẩn link khi rời hẳn khỏi nhóm
    });

    // Thêm popup vào nhóm
    groupElement.appendChild(popupElement);

    // Tạo text cho phòng
    const textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textElement.setAttribute("x", room.x);
    textElement.setAttribute("y", room.y + 5); // Đặt text phía dưới icon
    textElement.setAttribute("fill", "red");
    textElement.setAttribute("font-size", "14");
    textElement.setAttribute("font-family", "Arial");
    textElement.setAttribute("font-style", "italic");
    textElement.setAttribute("text-anchor", "middle"); // Căn giữa theo chiều ngang
    textElement.setAttribute("dominant-baseline", "middle"); // Căn giữa theo chiều dọc
    textElement.dataset.id = room.id;

    // Thêm icon và text vào nhóm
    groupElement.addEventListener("click", (event) => {
      if (!isEditMode) return;

      event.stopPropagation();
      selectRoom(textElement);
    });
    groupElement.appendChild(iconElement);
    groupElement.appendChild(textElement);

    // Thêm nhóm vào SVG
    svgElement.appendChild(groupElement);
    groupElement.style.display = toggle1 ? "block" : "none"; // Áp dụng trạng thái hiển thị hiện tại

    cameraGroups.push(groupElement);
  }

  function selectRoom(roomElement) {
    if (selectedRoomElement) {
      selectedRoomElement.setAttribute("stroke", "none");
    }
    selectedRoomElement = roomElement;
    roomElement.setAttribute("stroke", "red");
    roomElement.setAttribute("stroke-width", "1");
    selectedRoomId = roomElement.dataset.id;
  }

  function initializeDeleteKeyEvent(svgDoc) {
  const handleKey = (e) => {
    if (e.key === "Delete" && isEditMode && selectedRoomId && selectedRoomElement) {
      fetch(`${camerasUrl}/${selectedRoomId}`, {
        method: "DELETE",
      })
        .then(() => {
          const group = selectedRoomElement.closest("g"); // Lấy nhóm <g> chứa camera
          if (group) {
            group.remove();
            // Loại bỏ khỏi mảng cameraGroups
            cameraGroups = cameraGroups.filter(g => g !== group);
          }
          selectedRoomId = null;
          selectedRoomElement = null;
        })
        .catch((err) => console.error("Lỗi khi xóa:", err));
    }
  };

  document.addEventListener("keydown", handleKey);
  svgDoc.addEventListener("keydown", handleKey);
}

  hiddenCamera.addEventListener("click", () => {
    toggle1 = !toggle1;
    localStorage.setItem("cameraVisibility", toggle1);
    cameraGroups.forEach(group => {
      group.style.display = toggle1 ? "block" : "none";
    });
  });
}
