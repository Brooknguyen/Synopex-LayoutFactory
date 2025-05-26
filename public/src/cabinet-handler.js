// camera-handler.js
export function initCabinetFunctions(config) {
  const {
    settingsUrl,
    cabinetsUrl,
    containerSelector = "left-wapper",
    toggleBtnSelector = "hidden-cabinet-btn"
  } = config;

  const cabinetModal = document.createElement("div");
cabinetModal.id = "cabinet-modal";
cabinetModal.style.cssText = `
  display: none;
  position: absolute;
  top: 0px; left: 0px;
  width: 1920px; height: 1080px;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 2000;
  justify-content: center;
  align-items: center;
`;

cabinetModal.innerHTML = `
  <div style="
    position: relative;
    left:800px;
    top: 250px;
    background: white;
    padding: 20px;
    border-radius: 10px;
    width: 320px;
    font-family: Arial;
  ">
    <h2 style="margin-top: 0; color: #007bff; text-align: center;">Thêm tủ điện</h2>
    <form id="cabinet-form">
      <label>Tên tủ:</label><br/>
      <input type="text" name="name" required style="width: 100%; padding: 6px; margin-bottom: 10px; border: 1px solid #ccc;" />

      <label>Mã tủ:</label><br/>
      <input type="text" name="cabinetCode" style="width: 100%; padding: 6px; margin-bottom: 10px; border: 1px solid #ccc;" />

      <label>Điện áp:</label><br/>
      <input type="text" name="voltage" required style="width: 100%; padding: 6px; margin-bottom: 10px; border: 1px solid #ccc;" />

      <label>Dòng điện:</label><br/>
      <input type="text" name="current" required style="width: 100%; padding: 6px; margin-bottom: 10px; border: 1px solid #ccc;" />

      <label>Cấp độ bảo vệ:</label><br/>
      <input type="text" name="protectionLevel" style="width: 100%; padding: 6px; margin-bottom: 10px; border: 1px solid #ccc;" />

      <label>Nhà sản xuất:</label><br/>
      <input type="text" name="manufacturing" style="width: 100%; padding: 6px; margin-bottom: 10px; border: 1px solid #ccc;" />

      <label>Chức năng:</label><br/>
      <textarea name="cabinetFunction" rows="3" style="width: 100%; padding: 6px; margin-bottom: 15px; border: 1px solid #ccc;"></textarea>

      <div style="text-align: right;">
        <button type="submit" style="margin-right: 10px; width: 60px; height: 30px; background-color: green; border: 1px solid; border-radius: 5px;position: relative; right:147px">Save</button>
        <button type="button" id="cancel-btn" style="width: 60px; height: 30px; background-color: red; border: 1px solid; border-radius: 5px;position: relative; right:5px">Cancel</button>
      </div>
    </form>
  </div>
`;

document.body.appendChild(cabinetModal);


  let toggleCabinet = localStorage.getItem("cabinetVisibility") === "true";
  let selectedCabinetId = null;
  let isEditMode = false;
  let selectedCabinet = null;
  const iframe = document.getElementById(containerSelector);
  const hiddenCabinet = document.getElementById(toggleBtnSelector);
  let cabinetGroups = [];

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
    fetch(cabinetsUrl)
      .then(res => res.json())
      .then(rooms => {
        rooms.forEach(room => createRoomText(svgElement, room));
        cabinetGroups.forEach(group => {
          group.style.display = toggleCabinet ? "block" : "none";
        });
      });
  }

  function initializeSvgClickEvent(svgElement) {
  const modal = document.getElementById("cabinet-modal");
  const form = document.getElementById("cabinet-form");
  const cancelBtn = document.getElementById("cancel-btn");

  let svgPoint = null;

  svgElement.addEventListener("click", (event) => {
    if (!isEditMode) return;

    svgPoint = getSvgCoordinates(svgElement, event);
    form.reset(); // Xóa dữ liệu cũ
    modal.style.display = "block"; // Hiện form
  });

  cancelBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const cabinet = {
      name: formData.get("name"),
      cabinetCode: formData.get("cabinetCode"),
      voltage: formData.get("voltage"),
      current: formData.get("current"),
      protectionLevel: formData.get("protectionLevel"),
      manufacturing: formData.get("manufacturing"),
      cabinetFunction: formData.get("cabinetFunction"),
      x: svgPoint.x,
      y: svgPoint.y,
    };

    modal.style.display = "none";
    saveNewRoom(svgElement, cabinet);
  });
}

  function getSvgCoordinates(svgElement, event) {
    const point = svgElement.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(svgElement.getScreenCTM().inverse());
  }

  function saveNewRoom(svgElement, cabinet) {
    fetch(cabinetsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cabinet),
    })
      .then(res => res.json())
      .then(savedCabinet => createRoomText(svgElement, savedCabinet));
  }

  function createRoomText(svgElement, cabinet) {
    const groupElement = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Tạo icon (hình tròn hoặc hình ảnh)
    const iconElement = document.createElementNS("http://www.w3.org/2000/svg", "image"); 
    iconElement.setAttribute("href", "cabinet.png"); // Đường dẫn đến icon
    iconElement.setAttribute("x", cabinet.x - 10); // Tọa độ x
    iconElement.setAttribute("y", cabinet.y - 30); // Tọa độ y (đặt icon phía trên text)
    iconElement.setAttribute("width", "25"); // Bán kính
    // Màu sắc của icon
    
    // Tạo popup khi hover vào icon
    const popupElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
    popupElement.setAttribute("x", cabinet.x);
    popupElement.setAttribute("y", cabinet.y + 10); // Đặt popup phía trên icon
    popupElement.setAttribute("fill", "red");
    popupElement.setAttribute("font-size", "14");
    popupElement.setAttribute("font-family", "Arial");
    popupElement.setAttribute("font-style", "italic");
    popupElement.setAttribute("text-anchor", "middle");
    popupElement.setAttribute("dominant-baseline", "middle");
    popupElement.textContent = `${cabinet.name}`;
    popupElement.style.display = "none"; // Ẩn popup ban đầu
    // Tạo đường link xem chi tiết
    const cabinetElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
    cabinetElement.setAttribute("x", cabinet.x);
    cabinetElement.setAttribute("y", cabinet.y + 25); // Đặt link phía dưới text room.name
    cabinetElement.setAttribute("fill", "blue");
    cabinetElement.setAttribute("font-size", "12");
    cabinetElement.setAttribute("font-family", "Arial");
    cabinetElement.setAttribute("text-anchor", "middle");
    cabinetElement.setAttribute("dominant-baseline", "middle");
    cabinetElement.style.cursor = "pointer";
    cabinetElement.style.textDecoration = "underline"; // Gạch chân link
    cabinetElement.style.display = "none"; // Ẩn link ban đầu
    cabinetElement.textContent = "Xem chi tiết";

    // Thêm sự kiện click vào link
    cabinetElement.addEventListener("click", () => {
      // Tạo iframe để mở link camera
      const iframe = document.createElement("iframe");
      iframe.style.width = "400px";
      iframe.style.height = "350px";
      iframe.style.position = "absolute";
      iframe.style.top = "500px";
      iframe.style.left = "950px";
      iframe.style.borderRadius = "10px";
      iframe.style.transform = "translate(-50%, -50%)";
      iframe.style.border = "1px solid black";
      iframe.style.zIndex = "1000";
      iframe.style.backgroundColor = "rgba(189, 227, 242, 0.6)"; // Nền trắng với độ trong suốt
      // Gán cả tên và information vào iframe
    iframe.onload = function() {
        iframe.contentDocument.body.innerHTML = `
            <div style="padding-left: 15px;padding-right:15px; font-family: Arial;">
                <h2 style="margin: 0 auto;margin-bottom: 15px;margin-top:20px;text-align: center; color: blue; font-style: italic; font-weight: normal">${cabinet.name}</h2>
                <div style="margin-bottom: 15px">Cabinet Code: ${cabinet.cabinetCode}</div>
                <div style="margin-bottom: 15px">Voltage: ${cabinet.voltage}</div>
                <div style="margin-bottom: 15px">Current: ${cabinet.current}</div>
                <div style="margin-bottom: 15px">Protection Level: ${cabinet.protectionLevel}</div>
                <div style="margin-bottom: -10px">Manufacturing: ${cabinet.manufacturing}</div>
                <div style="margin-bottom: 15px; word-break: break-word; white-space: pre-line; max-width: 360px;line-height: 24px;">
                    Function: <span style="word-break: break-word;">${cabinet.cabinetFunction}</span>
                </div>
            </div>
        `;
    };
    iframe.src = "about:blank";

      // Tạo nút đóng iframe
      const closeButton = document.createElement("button");
      closeButton.textContent = "X";
      closeButton.style.border = "none";
      closeButton.style.fontSize = "19px";
      closeButton.style.color = "red";
      closeButton.style.fontFamily = "Arial";
      closeButton.style.fontWeight = "bold";
      closeButton.style.position = "absolute";
      closeButton.style.top = "336px";
      closeButton.style.left = "1120px";
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
    groupElement.appendChild(cabinetElement);
    // Thêm sự kiện hover vào icon
    iconElement.addEventListener("mouseenter", () => {
      popupElement.style.display = "block"; // Hiện popup khi hover
      cabinetElement.style.display = "block"; // Hiện link khi hover
    });

    groupElement.addEventListener("mouseleave", () => {
      popupElement.style.display = "none"; // Ẩn popup khi rời hẳn khỏi nhóm
      cabinetElement.style.display = "none"; // Ẩn link khi rời hẳn khỏi nhóm
    });

    // Thêm popup vào nhóm
    groupElement.appendChild(popupElement);

    // Tạo text cho phòng
    const textElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textElement.setAttribute("x", cabinet.x);
    textElement.setAttribute("y", cabinet.y + 5); // Đặt text phía dưới icon
    textElement.setAttribute("fill", "red");
    textElement.setAttribute("font-size", "14");
    textElement.setAttribute("font-family", "Arial");
    textElement.setAttribute("font-weight", "bold");
    textElement.setAttribute("text-anchor", "middle"); // Căn giữa theo chiều ngang
    textElement.setAttribute("dominant-baseline", "middle"); // Căn giữa theo chiều dọc
    textElement.dataset.id = cabinet.id;

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
    groupElement.style.display = toggleCabinet ? "block" : "none"; // Áp dụng trạng thái hiển thị hiện tại

    cabinetGroups.push(groupElement);
  }

  function selectRoom(cabinetElement) {
    if (selectedCabinet) {
      selectedCabinet.setAttribute("stroke", "none");
    }
    selectedCabinet = cabinetElement;
    cabinetElement.setAttribute("stroke", "red");
    cabinetElement.setAttribute("stroke-width", "1");
    selectedCabinetId = cabinetElement.dataset.id;
  }

  function initializeDeleteKeyEvent(svgDoc) {
  const handleKey = (e) => {
    if (e.key === "Delete" && isEditMode && selectedCabinetId && selectedCabinet) {
      fetch(`${cabinetsUrl}/${selectedCabinetId}`, {
        method: "DELETE",
      })
        .then(() => {
          const group = selectedCabinet.closest("g"); // Lấy nhóm <g> chứa camera
          if (group) {
            group.remove();
            // Loại bỏ khỏi mảng cameraGroups
            cabinetGroups = cabinetGroups.filter(g => g !== group);
          }
          selectedCabinetId = null;
          selectedCabinet = null;
        })
        .catch((err) => console.error("Lỗi khi xóa:", err));
    }
  };

  document.addEventListener("keydown", handleKey);
  svgDoc.addEventListener("keydown", handleKey);
}

  hiddenCabinet.addEventListener("click", () => {
    toggleCabinet = !toggleCabinet;
    localStorage.setItem("cabinetVisibility", toggleCabinet);
    cabinetGroups.forEach(group => {
      group.style.display = toggleCabinet ? "block" : "none";
    });
  });
}
