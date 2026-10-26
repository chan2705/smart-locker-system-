/**
 * SMART LOCKER - CLEAN BRIGHT LIGHT THEME DEMO ENGINE
 */

const STATE = {
  activeTab: 'shipper',
  selectedSize: 'S',
  parcels: [
    {
      id: 'P01',
      tracking: 'VNPOST-82910',
      recipientPhone: '0912.345.678',
      boxId: 2,
      pin: '619284',
      size: 'Cỡ S',
      time: '14:20 Hôm nay'
    },
    {
      id: 'P02',
      tracking: 'SPX-391024',
      recipientPhone: '0988.777.666',
      boxId: 6,
      pin: '839201',
      size: 'Cỡ M',
      time: '15:45 Hôm nay'
    }
  ],
  rentals: [
    {
      id: 'R01',
      name: 'Máy khoan pin Bosch 18V',
      rate: '20.000đ / giờ',
      deposit: 'Cọc: 500.000đ',
      icon: '🪛',
      boxId: 10,
      isRenting: false
    },
    {
      id: 'R02',
      name: 'Bộ vợt Pickleball Carbon',
      rate: '25.000đ / giờ',
      deposit: 'Cọc: 400.000đ',
      icon: '🏓',
      boxId: 8,
      isRenting: false
    },
    {
      id: 'R03',
      name: 'Bộ dụng cụ cơ khí Dremel',
      rate: '15.000đ / giờ',
      deposit: 'Cọc: 300.000đ',
      icon: '🧰',
      boxId: 11,
      isRenting: false
    },
    {
      id: 'R04',
      name: 'Bơm lốp ô tô Xiaomi',
      rate: '10.000đ / giờ',
      deposit: 'Cọc: 250.000đ',
      icon: '🚗',
      boxId: 7,
      isRenting: false
    }
  ]
};

// ================= AUDIO CHIME =================
function playChime(freq = 600, duration = 0.15) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

// ================= DOM ELEMENTS =================
const tabBtns = document.querySelectorAll('.tab-btn');
const tabViews = document.querySelectorAll('.tab-view');
const sizeCards = document.querySelectorAll('.size-card');
const inputPhone = document.getElementById('shipper-phone');
const inputTracking = document.getElementById('shipper-tracking');
const btnOpenShipper = document.getElementById('btn-open-shipper');
const parcelsContainer = document.getElementById('parcels-container');
const rentalsContainer = document.getElementById('rentals-container');
const residentBadge = document.getElementById('resident-count');

// Popup Modal
const modal = document.getElementById('popup-modal');
const modalTitle = document.getElementById('popup-title');
const modalBox = document.getElementById('popup-box');
const modalMsg = document.getElementById('popup-msg');
const btnCloseModal = document.getElementById('btn-popup-close');

// ================= 1. TAB SWITCHING =================
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-tab');
    if (STATE.activeTab === target) return;

    STATE.activeTab = target;
    tabBtns.forEach(b => b.classList.remove('active'));
    tabViews.forEach(v => v.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(`view-${target}`).classList.add('active');
    playChime(650, 0.08);
  });
});

// ================= 2. SHIPPER FLOW =================
sizeCards.forEach(card => {
  card.addEventListener('click', () => {
    sizeCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    STATE.selectedSize = card.getAttribute('data-size');
    playChime(550, 0.06);
  });
});

document.querySelectorAll('.quick-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    inputPhone.value = tag.getAttribute('data-phone');
    playChime(500, 0.05);
  });
});

btnOpenShipper.addEventListener('click', () => {
  const phone = inputPhone.value.trim();
  const tracking = inputTracking.value.trim() || `VNPOST-${Math.floor(1000 + Math.random() * 9000)}`;

  if (!phone) {
    alert('Vui lòng nhập số điện thoại người nhận!');
    return;
  }

  // Assigned box
  const boxId = STATE.selectedSize === 'S' ? 3 : STATE.selectedSize === 'M' ? 5 : 9;
  const pin = String(Math.floor(100000 + Math.random() * 900000));

  // Show Popup
  showModal(
    'CỬA NGĂN TỦ ĐÃ MỞ!',
    `NGĂN SỐ 0${boxId} (${STATE.selectedSize})`,
    `Xin mời bỏ kiện hàng vào bên trong và đóng chặt cánh cửa lại.\nMã PIN nhận đồ của cư dân: ${pin}`
  );

  // Add to Resident list
  STATE.parcels.unshift({
    id: 'P_' + Date.now().toString().slice(-4),
    tracking,
    recipientPhone: phone,
    boxId,
    pin,
    size: `Cỡ ${STATE.selectedSize}`,
    time: 'Vừa xong'
  });

  inputTracking.value = '';
  renderResidentParcels();
});

// ================= 3. RESIDENT FLOW =================
function renderResidentParcels() {
  parcelsContainer.innerHTML = '';
  residentBadge.textContent = STATE.parcels.length;

  if (STATE.parcels.length === 0) {
    parcelsContainer.innerHTML = `
      <div class="resident-empty-state">
        <div class="empty-icon">📭</div>
        <div style="font-weight: 700; color: #1E293B;">Hiện không có kiện hàng nào chờ nhận</div>
        <p style="font-size: 12px; margin-top: 4px;">Khi shipper gửi hàng vào tủ, thông tin sẽ hiện ở đây.</p>
      </div>
    `;
    return;
  }

  STATE.parcels.forEach(p => {
    const card = document.createElement('div');
    card.className = 'parcel-item-card';
    card.innerHTML = `
      <div class="parcel-top-header">
        <span class="box-number-tag">NGĂN SỐ 0${p.boxId} (${p.size})</span>
        <span class="pin-display-tag">MÃ PIN: ${p.pin}</span>
      </div>
      <div class="parcel-data-line">
        <span class="field-name">Mã vận đơn:</span>
        <span class="field-value">${p.tracking}</span>
      </div>
      <div class="parcel-data-line">
        <span class="field-name">Người nhận:</span>
        <span class="field-value">${p.recipientPhone}</span>
      </div>
      <div class="parcel-data-line">
        <span class="field-name">Thời gian:</span>
        <span class="field-value">${p.time}</span>
      </div>
      <button class="btn-green-unlock" data-id="${p.id}" data-box="${p.boxId}">
        <span>🔓</span> MỞ TỦ LẤY ĐỒ NGAY
      </button>
    `;

    card.querySelector('.btn-green-unlock').addEventListener('click', () => {
      showModal(
        'CỬA NGĂN TỦ ĐÃ MỞ!',
        `NGĂN SỐ 0${p.boxId}`,
        `Cửa tủ đã bung mở. Vui lòng lấy kiện hàng ${p.tracking} ra và đóng cánh cửa lại.`
      );
      STATE.parcels = STATE.parcels.filter(x => x.id !== p.id);
      renderResidentParcels();
    });

    parcelsContainer.appendChild(card);
  });
}

// Quick PIN open
document.getElementById('btn-quick-pin').addEventListener('click', () => {
  const pinVal = document.getElementById('quick-pin-input').value.trim();
  if (!pinVal) {
    alert('Vui lòng nhập mã PIN 6 số!');
    return;
  }

  const found = STATE.parcels.find(p => p.pin === pinVal);
  if (found) {
    showModal(
      'CỬA NGĂN TỦ ĐÃ MỞ!',
      `NGĂN SỐ 0${found.boxId}`,
      `Khớp đúng mã PIN! Vui lòng lấy kiện hàng ${found.tracking} và đóng cửa tủ lại.`
    );
    STATE.parcels = STATE.parcels.filter(p => p.id !== found.id);
    document.getElementById('quick-pin-input').value = '';
    renderResidentParcels();
  } else {
    showModal(
      'CỬA NGĂN TỦ ĐÃ MỞ!',
      'NGĂN SỐ 02',
      `Khớp mã PIN dự phòng! Cửa tủ đã bung mở. Xin mời lấy đồ và đóng cửa.`
    );
    document.getElementById('quick-pin-input').value = '';
  }
});

// ================= 4. RENTAL FLOW =================
function renderRentals() {
  rentalsContainer.innerHTML = '';

  STATE.rentals.forEach(item => {
    const card = document.createElement('div');
    card.className = 'rental-product-card';
    card.innerHTML = `
      <div class="product-icon-box">${item.icon}</div>
      <div class="product-info-box">
        <div class="product-title">${item.name}</div>
        <div class="product-pricing">${item.rate} • ${item.deposit}</div>
        <div class="product-box-hint">Vị trí: Ngăn số ${item.boxId}</div>
      </div>
      <div>
        ${item.isRenting 
          ? `<button class="btn-amber-rent active-return" data-id="${item.id}">Trả Đồ</button>`
          : `<button class="btn-amber-rent" data-id="${item.id}">Thuê Ngay</button>`
        }
      </div>
    `;

    card.querySelector('.btn-amber-rent').addEventListener('click', () => {
      if (item.isRenting) {
        showModal(
          'MỞ NGĂN TỦ ĐỂ TRẢ ĐỒ',
          `NGĂN SỐ ${item.boxId}`,
          `Vui lòng đặt ${item.name} vào lại ngăn số ${item.boxId} và đóng cửa. Tiền cọc sẽ được hoàn tự động!`
        );
        item.isRenting = false;
      } else {
        showModal(
          'ĐÃ MỞ TỦ LẤY ĐỒ THUÊ',
          `NGĂN SỐ ${item.boxId}`,
          `Quét chuyển khoản cọc thành công! Cửa ngăn số ${item.boxId} đã mở để bạn lấy ${item.name}.`
        );
        item.isRenting = true;
      }
      renderRentals();
    });

    rentalsContainer.appendChild(card);
  });
}

// ================= 5. POPUP CONTROLLER =================
function showModal(title, boxText, message) {
  modalTitle.textContent = title;
  modalBox.textContent = boxText;
  modalMsg.textContent = message;
  modal.classList.add('active');
  playChime(750, 0.2);
}

btnCloseModal.addEventListener('click', () => {
  modal.classList.remove('active');
  playChime(450, 0.05);
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.remove('active');
  }
});

// ================= BOOTSTRAP =================
renderResidentParcels();
renderRentals();
