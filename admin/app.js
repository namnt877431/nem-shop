/* ═══════════════════════════════════════════════════════════════
   NEM shop — trang quản trị

   Một trang, bảy màn: bảng điều khiển, đơn thuê, lịch máy, khách,
   kho máy, nội dung trang, cài đặt.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var h = UI.h;

  var STATUS = {
    giu_cho:   { label: 'Giữ chỗ',   kind: 'amber'   },
    dang_thue: { label: 'Đang thuê', kind: 'magenta' },
    da_tra:    { label: 'Đã trả',    kind: 'done'    },
    huy:       { label: 'Huỷ',       kind: 'ghost'   }
  };
  var STATUS_ORDER = ['giu_cho', 'dang_thue', 'da_tra', 'huy'];

  var DEPOSIT = {
    tien:     'Cọc tiền',
    tai_san:  'Giữ tài sản',
    the_sv:   'Thẻ sinh viên',
    bao_lanh: 'Người bảo lãnh'
  };

  // Đơn còn hiệu lực mới chiếm chỗ của máy
  var HOLDS_CAMERA = ['giu_cho', 'dang_thue'];

  var state = {
    view: 'bang',
    cameras: [],
    customers: [],
    bookings: [],
    content: null,
    month: null,            // {y, m} cho màn lịch
    filter: { status: '', camera: '', q: '' }
  };

  var root = document.getElementById('app');

  /* ═══════════════════════════════════════════════════════════════
     Khởi động
     ═══════════════════════════════════════════════════════════════ */
  function boot() {
    var now = new Date();
    state.month = { y: now.getFullYear(), m: now.getMonth() };

    if (!DB.hasSession()) { renderLogin(); return; }
    loadAll().then(renderShell).catch(function (err) {
      if (err && err.status === 401) { renderLogin(err.message); return; }
      renderFatal(err);
    });
  }

  function loadAll() {
    return Promise.all([
      DB.table('cameras').list({ order: 'sort.asc' }),
      DB.table('customers').list({ order: 'name.asc' }),
      DB.table('bookings').list({ order: 'start_date.desc' }),
      DB.content.get()
    ]).then(function (parts) {
      state.cameras = parts[0] || [];
      state.customers = parts[1] || [];
      state.bookings = parts[2] || [];
      state.content = Content.withDefaults(parts[3]);
    });
  }

  function reload(tables) {
    var jobs = (tables || ['cameras', 'customers', 'bookings']).map(function (t) {
      return DB.table(t).list({ order: t === 'bookings' ? 'start_date.desc' : t === 'cameras' ? 'sort.asc' : 'name.asc' })
        .then(function (rows) { state[t] = rows || []; });
    });
    return Promise.all(jobs).then(render);
  }

  function fail(err) {
    console.error(err);
    UI.toast(err && err.message ? err.message : 'Có lỗi xảy ra.', 'err');
    if (err && err.status === 401) setTimeout(function () { renderLogin(err.message); }, 600);
  }

  /* ═══════════════════════════════════════════════════════════════
     Màn đăng nhập
     ═══════════════════════════════════════════════════════════════ */
  function renderLogin(message) {
    UI.clear(root);

    var f = UI.form([
      { name: 'email', label: 'Email', type: 'text', placeholder: 'ban@example.com' },
      { name: 'password', label: 'Mật khẩu', type: 'text' }
    ], {});
    f.inputs.password.el.type = 'password';

    var btn = h('button', { class: 'btn btn-solid', type: 'submit', text: 'Vào quản trị' });

    var form = h('form', {
      class: 'login-card',
      onsubmit: function (e) {
        e.preventDefault();
        var v = f.read();
        if (!v.email || !v.password) { UI.toast('Điền cả email và mật khẩu.', 'err'); return; }
        btn.disabled = true;
        btn.textContent = 'Đang vào…';
        DB.signIn(v.email, v.password)
          .then(function () { boot(); })
          .catch(function (err) {
            btn.disabled = false;
            btn.textContent = 'Vào quản trị';
            UI.toast(err.message || 'Không đăng nhập được.', 'err');
          });
      }
    }, [
      h('span', { class: 'mono', text: 'NEM shop · quản trị' }),
      h('h1', { class: 'display', text: 'Đăng nhập' }),
      message ? h('p', { class: 'login-msg', text: message }) : null,
      f.el,
      btn,
      h('button', {
        class: 'link-btn', type: 'button', text: 'Đổi dự án Supabase / dùng chế độ máy này',
        onclick: function () { openConfigSheet(); }
      })
    ]);

    root.appendChild(h('div', { class: 'login' }, form));
  }

  function renderFatal(err) {
    UI.clear(root);
    root.appendChild(h('div', { class: 'login' },
      h('div', { class: 'login-card' }, [
        h('span', { class: 'mono', text: 'Không nạp được dữ liệu' }),
        h('h1', { class: 'display', text: 'Kẹt rồi' }),
        h('p', { class: 'login-msg', text: err && err.message ? err.message : String(err) }),
        h('p', { class: 'hint', text: 'Kiểm tra lại địa chỉ dự án, khoá anon, và xem schema.sql đã chạy chưa.' }),
        h('button', { class: 'btn btn-solid', type: 'button', text: 'Mở cài đặt kết nối', onclick: openConfigSheet }),
        h('button', { class: 'link-btn', type: 'button', text: 'Thử lại', onclick: boot })
      ])));
  }

  /* ═══════════════════════════════════════════════════════════════
     Khung trang
     ═══════════════════════════════════════════════════════════════ */
  var NAV = [
    { id: 'bang',    label: 'Bảng điều khiển' },
    { id: 'don',     label: 'Đơn thuê' },
    { id: 'lich',    label: 'Lịch máy' },
    { id: 'khach',   label: 'Khách' },
    { id: 'kho',     label: 'Kho máy' },
    { id: 'noidung', label: 'Nội dung trang' },
    { id: 'caidat',  label: 'Cài đặt' }
  ];

  var viewHost = null;

  function renderShell() {
    UI.clear(root);

    var user = DB.currentUser();
    var nav = h('nav', { class: 'topnav' }, NAV.map(function (item) {
      return h('button', {
        class: 'navlink', type: 'button', text: item.label,
        dataset: { view: item.id },
        onclick: function () { go(item.id); }
      });
    }));

    viewHost = h('main', { class: 'view', id: 'view' });

    root.appendChild(h('div', { class: 'shell' }, [
      h('header', { class: 'topbar' },
        h('div', { class: 'wrap topbar-in' }, [
          h('span', { class: 'brand' }, [
            'NEM', h('i', { text: '·' }), 'shop', h('em', { text: 'quản trị' })
          ]),
          nav,
          h('span', {
            class: 'who mono',
            text: DB.isRemote() ? (user && user.email ? user.email : 'đã đăng nhập') : 'chế độ máy này'
          })
        ])),
      h('div', { class: 'perf', 'aria-hidden': 'true' }),
      viewHost
    ]));

    if (!DB.isRemote()) {
      viewHost.appendChild(h('div', { class: 'banner' }, [
        h('span', { class: 'mono', text: 'Chế độ máy này' }),
        h('p', { text: 'Dữ liệu đang nằm trong trình duyệt của máy đang mở, xoá cache là mất. Vào Cài đặt để nối với Supabase.' }),
        h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: 'Nối Supabase', onclick: openConfigSheet })
      ]));
    }

    render();
  }

  function go(view) {
    state.view = view;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function render() {
    if (!viewHost) return;

    Array.prototype.forEach.call(document.querySelectorAll('.navlink'), function (b) {
      b.classList.toggle('on', b.dataset.view === state.view);
    });

    var body = viewHost.querySelector('.view-body');
    if (body) viewHost.removeChild(body);

    var pane = h('div', { class: 'view-body' });
    ({
      bang: viewDashboard,
      don: viewBookings,
      lich: viewCalendar,
      khach: viewCustomers,
      kho: viewCameras,
      noidung: viewContent,
      caidat: viewSettings
    })[state.view](pane);

    viewHost.appendChild(pane);
  }

  function head(title, sub, actions) {
    return h('div', { class: 'head' }, [
      h('div', {}, [
        h('h1', { class: 'display', text: title }),
        sub ? h('p', { text: sub }) : null
      ]),
      actions ? h('div', { class: 'head-actions' }, actions) : null
    ]);
  }

  /* ═══════════════════════════════════════════════════════════════
     Tra cứu nhanh
     ═══════════════════════════════════════════════════════════════ */
  function cameraById(id) {
    for (var i = 0; i < state.cameras.length; i++) if (state.cameras[i].id === id) return state.cameras[i];
    return null;
  }
  function customerById(id) {
    for (var i = 0; i < state.customers.length; i++) if (state.customers[i].id === id) return state.customers[i];
    return null;
  }
  function cameraName(id) { var c = cameraById(id); return c ? c.name : '— máy đã xoá —'; }
  function customerName(id) { var c = customerById(id); return c ? c.name : '— khách đã xoá —'; }

  function discountFor(days) {
    var tiers = (state.content && state.content.calc && state.content.calc.tiers) || [];
    var best = 0;
    tiers.forEach(function (t) { if (days >= t.days && t.percent > best) best = t.percent; });
    return best;
  }

  function priceOf(rate, days, percent) {
    return Math.round(rate * days * (1 - (percent || 0) / 100));
  }

  // Đơn nào đang chắn chỗ chiếc máy này trong khoảng ngày đó
  function clashes(cameraId, startISO, endISO, exceptId) {
    return state.bookings.filter(function (b) {
      return b.camera_id === cameraId &&
             b.id !== exceptId &&
             HOLDS_CAMERA.indexOf(b.status) !== -1 &&
             UI.overlaps(startISO, endISO, b.start_date, b.end_date);
    });
  }

  function nextCode(startISO) {
    var d = UI.parseISO(startISO) || new Date();
    var prefix = UI.pad2(d.getDate()) + UI.pad2(d.getMonth() + 1);
    var used = state.bookings.filter(function (b) {
      return String(b.code || '').indexOf(prefix + '-') === 0;
    }).length;
    return prefix + '-' + UI.pad2(used + 1);
  }

  function statusPill(status) {
    var s = STATUS[status] || { label: status, kind: null };
    return UI.pill(s.label, s.kind);
  }

  /* ═══════════════════════════════════════════════════════════════
     MÀN 1 — Bảng điều khiển
     ═══════════════════════════════════════════════════════════════ */
  function viewDashboard(pane) {
    var today = UI.todayISO();
    var soon = UI.addDays(today, 3);

    var out = state.bookings.filter(function (b) { return b.status === 'dang_thue'; });
    var late = out.filter(function (b) { return b.end_date < today; });
    var dueSoon = out.filter(function (b) { return b.end_date >= today && b.end_date <= soon; });
    var pickup = state.bookings.filter(function (b) {
      return b.status === 'giu_cho' && b.start_date <= soon;
    });

    var heldDeposit = state.bookings.filter(function (b) {
      return HOLDS_CAMERA.indexOf(b.status) !== -1 && !b.deposit_returned;
    }).reduce(function (sum, b) { return sum + (b.deposit_amount || 0); }, 0);

    var monthKey = today.slice(0, 7);
    var revenue = state.bookings.filter(function (b) {
      return b.status === 'da_tra' && String(b.end_date).slice(0, 7) === monthKey;
    }).reduce(function (sum, b) { return sum + (b.total || 0); }, 0);

    var busyToday = {};
    state.bookings.forEach(function (b) {
      if (HOLDS_CAMERA.indexOf(b.status) !== -1 && b.start_date <= today && today <= b.end_date) {
        busyToday[b.camera_id] = b;
      }
    });
    var freeCount = state.cameras.filter(function (c) {
      return c.active !== false && !busyToday[c.id];
    }).length;

    pane.appendChild(head('Bảng điều khiển', 'Tình hình hôm nay, ' + UI.fmtDateFull(today) + '.', [
      h('button', { class: 'btn btn-solid', type: 'button', text: 'Đơn thuê mới', onclick: function () { openBooking(null); } })
    ]));

    pane.appendChild(h('div', { class: 'kpis' }, [
      kpi('Máy đang ở ngoài', String(out.length), out.length + '/' + state.cameras.filter(function (c) { return c.active !== false; }).length + ' máy'),
      kpi('Máy rảnh hôm nay', String(freeCount), freeCount ? 'nhận đơn được ngay' : 'hết máy trống'),
      kpi('Cọc đang giữ', UI.vnd(heldDeposit), 'đồng, chưa trả lại'),
      kpi('Doanh thu tháng này', UI.vnd(revenue), 'đồng, tính đơn đã trả')
    ]));

    if (late.length) {
      pane.appendChild(alertBox('Quá hạn trả', late.map(function (b) {
        return bookingLine(b, 'trễ ' + (UI.spanDays(b.end_date, today) - 1) + ' ngày');
      }), 'danger'));
    }

    var cols = h('div', { class: 'cols' });

    cols.appendChild(panel('Sắp phải trả', dueSoon.length
      ? h('div', { class: 'lines' }, dueSoon
          .sort(function (a, b) { return a.end_date < b.end_date ? -1 : 1; })
          .map(function (b) { return bookingLine(b, 'trả ' + UI.fmtDate(b.end_date)); }))
      : emptyNote('Ba ngày tới không có máy nào tới hạn.')));

    cols.appendChild(panel('Sắp phải giao', pickup.length
      ? h('div', { class: 'lines' }, pickup
          .sort(function (a, b) { return a.start_date < b.start_date ? -1 : 1; })
          .map(function (b) { return bookingLine(b, 'giao ' + UI.fmtDate(b.start_date)); }))
      : emptyNote('Chưa có đơn giữ chỗ nào sắp đến ngày giao.')));

    pane.appendChild(cols);

    /* ── Doanh thu sáu tháng gần đây ── */
    var months = [];
    var cur = new Date();
    for (var i = 5; i >= 0; i--) {
      var d = new Date(cur.getFullYear(), cur.getMonth() - i, 1);
      months.push({ key: d.getFullYear() + '-' + UI.pad2(d.getMonth() + 1), y: d.getFullYear(), m: d.getMonth() });
    }
    var byMonth = months.map(function (mo) {
      var rows = state.bookings.filter(function (b) {
        return b.status === 'da_tra' && String(b.end_date).slice(0, 7) === mo.key;
      });
      return {
        label: UI.monthLabel(mo.y, mo.m),
        count: rows.length,
        total: rows.reduce(function (s, b) { return s + (b.total || 0); }, 0),
        days: rows.reduce(function (s, b) { return s + UI.spanDays(b.start_date, b.end_date); }, 0)
      };
    });
    var peak = Math.max.apply(null, byMonth.map(function (r) { return r.total; }).concat([1]));

    pane.appendChild(panel('Doanh thu sáu tháng', UI.table([
      { label: 'Tháng', cell: function (r) { return r.label; } },
      { label: '', cell: function (r) {
          return h('div', { class: 'bar' }, h('i', { style: { width: Math.round(r.total / peak * 100) + '%' } }));
        } },
      { label: 'Đơn', align: 'right', cell: function (r) { return String(r.count); } },
      { label: 'Ngày máy', align: 'right', cell: function (r) { return String(r.days); } },
      { label: 'Tiền', align: 'right', cell: function (r) { return UI.money(r.total); } }
    ], byMonth, { empty: 'Chưa có đơn nào đã trả.' })));
  }

  function kpi(label, value, sub) {
    return h('div', { class: 'kpi' }, [
      h('span', { class: 'mono', text: label }),
      h('strong', { text: value }),
      h('small', { text: sub })
    ]);
  }

  function panel(title, body) {
    return h('section', { class: 'panel' }, [
      h('div', { class: 'panel-head' }, h('span', { class: 'mono', text: title })),
      body
    ]);
  }

  function emptyNote(text) { return h('p', { class: 'empty', text: text }); }

  function alertBox(title, lines, kind) {
    return h('section', { class: 'panel panel-' + (kind || 'plain') }, [
      h('div', { class: 'panel-head' }, h('span', { class: 'mono', text: title })),
      h('div', { class: 'lines' }, lines)
    ]);
  }

  function bookingLine(b, right) {
    return h('button', {
      class: 'line', type: 'button', onclick: function () { openBooking(b); }
    }, [
      h('span', { class: 'line-main' }, [
        h('b', { text: customerName(b.customer_id) }),
        h('span', { class: 'mono', text: cameraName(b.camera_id) })
      ]),
      h('span', { class: 'line-side' }, [
        statusPill(b.status),
        h('span', { class: 'mono', text: right })
      ])
    ]);
  }

  /* ═══════════════════════════════════════════════════════════════
     MÀN 2 — Đơn thuê
     ═══════════════════════════════════════════════════════════════ */
  function viewBookings(pane) {
    pane.appendChild(head('Đơn thuê', state.bookings.length + ' đơn đã lập.', [
      h('button', { class: 'btn btn-solid', type: 'button', text: 'Đơn thuê mới', onclick: function () { openBooking(null); } })
    ]));

    var q = h('input', {
      type: 'search', placeholder: 'Tìm theo tên khách, mã đơn, ghi chú…', value: state.filter.q,
      oninput: function () { state.filter.q = q.value; render(); }
    });
    var statusSel = h('select', {
      onchange: function () { state.filter.status = statusSel.value; render(); }
    }, [h('option', { value: '', text: 'Mọi trạng thái' })].concat(STATUS_ORDER.map(function (s) {
      return h('option', { value: s, text: STATUS[s].label });
    })));
    statusSel.value = state.filter.status;

    var camSel = h('select', {
      onchange: function () { state.filter.camera = camSel.value; render(); }
    }, [h('option', { value: '', text: 'Mọi máy' })].concat(state.cameras.map(function (c) {
      return h('option', { value: c.id, text: c.name });
    })));
    camSel.value = state.filter.camera;

    pane.appendChild(h('div', { class: 'filters' }, [q, statusSel, camSel]));

    var needle = state.filter.q.trim().toLowerCase();
    var rows = state.bookings.filter(function (b) {
      if (state.filter.status && b.status !== state.filter.status) return false;
      if (state.filter.camera && b.camera_id !== state.filter.camera) return false;
      if (!needle) return true;
      return [b.code, customerName(b.customer_id), cameraName(b.camera_id), b.note, b.deposit_note]
        .join(' ').toLowerCase().indexOf(needle) !== -1;
    });

    var today = UI.todayISO();

    pane.appendChild(UI.table([
      { label: 'Mã', cell: function (b) { return h('span', { class: 'mono', text: b.code || '—' }); } },
      { label: 'Khách', cell: function (b) {
          var c = customerById(b.customer_id);
          return h('div', { class: 'cell-stack' }, [
            h('b', { text: c ? c.name : '— khách đã xoá —' }),
            h('span', { class: 'mono', text: c && c.phone ? c.phone : '' })
          ]);
        } },
      { label: 'Máy', cell: function (b) { return cameraName(b.camera_id); } },
      { label: 'Ngày', cell: function (b) {
          var days = UI.spanDays(b.start_date, b.end_date);
          return h('div', { class: 'cell-stack' }, [
            h('span', { text: UI.fmtDate(b.start_date) + ' → ' + UI.fmtDate(b.end_date) }),
            h('span', { class: 'mono', text: days + ' ngày' })
          ]);
        } },
      { label: 'Cọc', cell: function (b) {
          return h('div', { class: 'cell-stack' }, [
            h('span', { text: DEPOSIT[b.deposit_kind] || b.deposit_kind }),
            h('span', { class: 'mono', text: b.deposit_amount ? UI.money(b.deposit_amount) : (b.deposit_note || '') })
          ]);
        } },
      { label: 'Tiền thuê', align: 'right', cell: function (b) { return UI.money(b.total); } },
      { label: 'Trạng thái', cell: function (b) {
          var late = b.status === 'dang_thue' && b.end_date < today;
          return h('div', { class: 'cell-stack' }, [
            statusPill(b.status),
            late ? h('span', { class: 'mono warn', text: 'quá hạn' }) : null
          ]);
        } }
    ], rows, {
      empty: state.bookings.length ? 'Không có đơn nào khớp bộ lọc.' : 'Chưa có đơn nào. Bấm "Đơn thuê mới" để bắt đầu.',
      onRow: function (b) { openBooking(b); },
      rowClass: function (b) { return b.status === 'huy' ? 'row-off' : null; }
    }));
  }

  /* ── Biểu mẫu đơn thuê ── */
  function openBooking(existing) {
    if (!state.cameras.length) {
      UI.toast('Thêm ít nhất một chiếc máy vào kho trước đã.', 'err');
      go('kho');
      return;
    }

    var isNew = !existing;
    var b = existing || {
      camera_id: state.cameras[0].id,
      customer_id: state.customers.length ? state.customers[0].id : '',
      start_date: UI.todayISO(),
      end_date: UI.addDays(UI.todayISO(), 2),
      status: 'giu_cho',
      deposit_kind: 'tien',
      deposit_amount: 0,
      day_rate: state.cameras[0].day_rate || 0,
      discount_percent: 0,
      total: 0
    };

    var summary = h('div', { class: 'calc-summary' });
    var clashBox = h('div', { class: 'clash' });

    // Đơn cũ có mức giảm khác mốc mặc định thì coi như đã chốt tay, đừng đè lên.
    var touchedDiscount = !isNew &&
      (b.discount_percent || 0) !== discountFor(UI.spanDays(b.start_date, b.end_date));

    var f = UI.form([
      { name: 'code', label: 'Mã đơn', type: 'text',
        placeholder: isNew ? nextCode(b.start_date) : '', hint: 'Bỏ trống thì tự đặt theo ngày giao.' },

      { name: 'customer_id', label: 'Khách thuê', type: 'select',
        options: [{ value: '', label: '+ Khách mới…' }].concat(state.customers.map(function (c) {
          return { value: c.id, label: c.name + (c.phone ? ' · ' + c.phone : '') };
        })),
        onChange: function () { toggleNewCustomer(); } },
      { name: 'new_name', label: 'Tên khách mới', type: 'text' },
      { name: 'new_phone', label: 'Số điện thoại khách mới', type: 'text' },

      { name: 'camera_id', label: 'Máy', type: 'select',
        options: state.cameras.map(function (c) {
          return { value: c.id, label: c.name + (c.active === false ? ' (đã tắt)' : '') + ' · ' + UI.money(c.day_rate) };
        }),
        onChange: function () {
          var cam = cameraById(f.get('camera_id'));
          if (cam) f.set('day_rate', cam.day_rate);
          recalc();
        } },

      { name: 'start_date', label: 'Ngày giao', type: 'date', onChange: recalc },
      { name: 'end_date', label: 'Ngày trả', type: 'date', onChange: recalc },

      { name: 'day_rate', label: 'Đơn giá / ngày', type: 'money', onInput: recalc },
      { name: 'discount_percent', label: 'Giảm (%)', type: 'number', min: 0, max: 100,
        onInput: function () { touchedDiscount = true; recalc(); } },
      { name: 'total', label: 'Thành tiền', type: 'money',
        hint: 'Tự tính, nhưng sửa tay được nếu hai bên chốt khác.' },

      { type: 'divider', label: 'Tiền cọc' },
      { name: 'deposit_kind', label: 'Kiểu cọc', type: 'select',
        options: Object.keys(DEPOSIT).map(function (k) { return { value: k, label: DEPOSIT[k] }; }) },
      { name: 'deposit_amount', label: 'Số tiền cọc', type: 'money' },
      { name: 'deposit_note', label: 'Ghi chú cọc', type: 'text', placeholder: 'laptop Dell, thẻ SV + số của mẹ…', wide: true },
      { name: 'deposit_returned', label: 'Đã trả cọc lại cho khách', type: 'check', wide: true },

      { type: 'divider', label: 'Trạng thái' },
      { name: 'status', label: 'Trạng thái đơn', type: 'select',
        options: STATUS_ORDER.map(function (s) { return { value: s, label: STATUS[s].label }; }) },
      { name: 'note', label: 'Ghi chú', type: 'textarea', wide: true, rows: 3 }
    ], b);

    function toggleNewCustomer() {
      var showNew = !f.get('customer_id');
      ['new_name', 'new_phone'].forEach(function (n) {
        var field = f.inputs[n].el.closest('.field');
        if (field) field.hidden = !showNew;
      });
    }

    function recalc() {
      var start = f.get('start_date');
      var end = f.get('end_date');
      var days = UI.spanDays(start, end);

      UI.clear(clashBox);
      UI.clear(summary);

      if (!start || !end || days <= 0) {
        summary.appendChild(h('span', { class: 'mono warn', text: 'Ngày trả phải từ ngày giao trở đi.' }));
        return;
      }

      // Mốc giảm giá tự áp theo số ngày, trừ khi chủ shop đã tự gõ tay
      if (!touchedDiscount) f.set('discount_percent', discountFor(days));

      var rate = f.get('day_rate');
      var pct = f.get('discount_percent');
      f.set('total', priceOf(rate, days, pct));

      summary.appendChild(h('span', { class: 'mono', text: days + ' ngày × ' + UI.money(rate) }));
      if (pct > 0) summary.appendChild(h('span', { class: 'mono ok', text: 'giảm ' + pct + '%' }));
      summary.appendChild(h('b', { text: UI.money(priceOf(rate, days, pct)) }));

      var hit = clashes(f.get('camera_id'), start, end, b.id);
      if (hit.length) {
        clashBox.appendChild(h('span', { class: 'mono', text: 'Máy này đã có đơn trùng ngày' }));
        hit.forEach(function (x) {
          clashBox.appendChild(h('p', {
            text: (x.code ? x.code + ' · ' : '') + customerName(x.customer_id) + ' · ' +
                  UI.fmtDate(x.start_date) + ' → ' + UI.fmtDate(x.end_date) + ' · ' + STATUS[x.status].label
          }));
        });
      }
    }

    var actions = [{ label: 'Thôi', onClick: function (api) { api.close(); } }];

    if (!isNew) {
      actions.push({
        label: 'Xoá đơn', kind: 'danger',
        onClick: function (api) {
          UI.confirm('Xoá đơn này?', 'Đơn của ' + customerName(b.customer_id) + ' sẽ biến mất hẳn. Nếu chỉ muốn ghi nhận khách không lấy máy nữa thì đổi trạng thái sang Huỷ.', 'Xoá hẳn')
            .then(function (ok) {
              if (!ok) return;
              DB.table('bookings').remove(b.id)
                .then(function () { api.close(); UI.toast('Đã xoá đơn.'); return reload(['bookings']); })
                .catch(fail);
            });
        }
      });
    }

    actions.push({
      label: isNew ? 'Lập đơn' : 'Lưu đơn', kind: 'solid',
      onClick: function (api) { save(api); }
    });

    function save(api) {
      var v = f.read();

      if (!v.start_date || !v.end_date) { UI.toast('Cần cả ngày giao và ngày trả.', 'err'); return; }
      if (UI.spanDays(v.start_date, v.end_date) <= 0) { UI.toast('Ngày trả phải từ ngày giao trở đi.', 'err'); return; }

      if (HOLDS_CAMERA.indexOf(v.status) !== -1) {
        var hit = clashes(v.camera_id, v.start_date, v.end_date, b.id);
        if (hit.length) {
          UI.toast('Máy này đã có đơn khác trùng ngày. Đổi máy, đổi ngày, hoặc huỷ đơn kia trước.', 'err');
          return;
        }
      }

      var ensureCustomer = v.customer_id
        ? Promise.resolve(v.customer_id)
        : (function () {
            if (!v.new_name) {
              return Promise.reject(new Error('Chọn khách có sẵn, hoặc điền tên khách mới.'));
            }
            return DB.table('customers').insert({ name: v.new_name, phone: v.new_phone || '' })
              .then(function (c) { return c.id; });
          })();

      ensureCustomer.then(function (customerId) {
        var row = {
          code: v.code || nextCode(v.start_date),
          customer_id: customerId,
          camera_id: v.camera_id,
          start_date: v.start_date,
          end_date: v.end_date,
          day_rate: v.day_rate,
          discount_percent: v.discount_percent,
          total: v.total,
          deposit_kind: v.deposit_kind,
          deposit_amount: v.deposit_amount,
          deposit_note: v.deposit_note,
          deposit_returned: v.deposit_returned,
          status: v.status,
          note: v.note
        };
        return isNew ? DB.table('bookings').insert(row) : DB.table('bookings').update(b.id, row);
      }).then(function () {
        api.close();
        UI.toast(isNew ? 'Đã lập đơn.' : 'Đã lưu đơn.');
        return reload(['bookings', 'customers']);
      }).catch(fail);
    }

    UI.sheet({
      title: isNew ? 'Đơn thuê mới' : 'Đơn ' + (b.code || ''),
      eyebrow: isNew ? 'Lập đơn' : 'Sửa đơn',
      body: [f.el, h('div', { class: 'calc-strip' }, [summary, clashBox])],
      actions: actions
    });

    toggleNewCustomer();
    recalc();
  }

  /* ═══════════════════════════════════════════════════════════════
     MÀN 3 — Lịch máy
     ═══════════════════════════════════════════════════════════════ */
  function viewCalendar(pane) {
    var y = state.month.y, m = state.month.m;
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var today = UI.todayISO();

    pane.appendChild(head('Lịch máy', 'Ô tô màu là ngày máy đã có người giữ.', [
      h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: '‹ Tháng trước',
        onclick: function () { shiftMonth(-1); } }),
      h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: 'Hôm nay',
        onclick: function () { var n = new Date(); state.month = { y: n.getFullYear(), m: n.getMonth() }; render(); } }),
      h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: 'Tháng sau ›',
        onclick: function () { shiftMonth(1); } })
    ]));

    pane.appendChild(h('div', { class: 'month-label' }, [
      h('strong', { class: 'display', text: UI.monthLabel(y, m) }),
      h('div', { class: 'legend' }, STATUS_ORDER.filter(function (s) { return s !== 'huy'; }).map(function (s) {
        return h('span', { class: 'legend-item' }, [
          h('i', { class: 'sw sw-' + STATUS[s].kind }),
          h('span', { class: 'mono', text: STATUS[s].label })
        ]);
      }))
    ]));

    var live = state.cameras.filter(function (c) { return c.active !== false; });
    if (!live.length) {
      pane.appendChild(emptyNote('Chưa có máy nào đang bật trong kho.'));
      return;
    }

    var headRow = h('tr', {}, [h('th', { class: 'cal-name', text: 'Máy' })]);
    for (var d = 1; d <= daysInMonth; d++) {
      var iso = y + '-' + UI.pad2(m + 1) + '-' + UI.pad2(d);
      var dow = new Date(y, m, d).getDay();
      headRow.appendChild(h('th', {
        class: 'cal-day' + (dow === 0 || dow === 6 ? ' cal-weekend' : '') + (iso === today ? ' cal-today' : ''),
        text: String(d)
      }));
    }

    var body = h('tbody');
    live.forEach(function (cam) {
      var tr = h('tr', {}, [h('th', { class: 'cal-name', title: cam.name, text: cam.name })]);

      // Đơn nào phủ ngày nào, tính trước cho cả tháng
      var cover = [];
      for (var d = 1; d <= daysInMonth; d++) {
        var iso = y + '-' + UI.pad2(m + 1) + '-' + UI.pad2(d);
        cover[d] = null;
        for (var i = 0; i < state.bookings.length; i++) {
          var b = state.bookings[i];
          if (b.camera_id === cam.id && b.status !== 'huy' &&
              b.start_date <= iso && iso <= b.end_date) { cover[d] = b; break; }
        }
      }

      for (var d2 = 1; d2 <= daysInMonth; d2++) {
        var iso2 = y + '-' + UI.pad2(m + 1) + '-' + UI.pad2(d2);
        var hit = cover[d2];

        if (!hit) {
          // Ngày trống: đánh nhạt thứ bảy chủ nhật, vì cuối tuần là lúc
          // khách hỏi nhiều nhất — nhìn lịch phải thấy ngay chỗ còn chống.
          var wk = new Date(y, m, d2).getDay();
          tr.appendChild(h('td', {
            class: 'cal-cell' + (wk === 0 || wk === 6 ? ' cal-weekend' : '') +
                   (iso2 === today ? ' cal-today' : '')
          }));
          continue;
        }

        // Tên khách chỉ viết ở ô đầu của dải, và chỉ khi dải đủ rộng để
        // chứa chữ — dải một hai ngày thì chữ sẽ tràn sang đơn bên cạnh.
        var opensHere = !cover[d2 - 1] || cover[d2 - 1].id !== hit.id;
        var run = 0;
        if (opensHere) {
          while (cover[d2 + run] && cover[d2 + run].id === hit.id) run++;
        }

        tr.appendChild(h('td', {
          class: 'cal-cell cal-on cal-' + STATUS[hit.status].kind +
                 (hit.start_date === iso2 ? ' cal-start' : '') +
                 (hit.end_date === iso2 ? ' cal-end' : '') +
                 (iso2 === today ? ' cal-today' : ''),
          title: customerName(hit.customer_id) + ' · ' +
                 UI.fmtDate(hit.start_date) + ' → ' + UI.fmtDate(hit.end_date) +
                 ' · ' + STATUS[hit.status].label,
          tabindex: 0,
          onclick: (function (bk) { return function () { openBooking(bk); }; })(hit),
          onkeydown: (function (bk) {
            return function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBooking(bk); } };
          })(hit)
        }, opensHere && run >= 3
             ? h('span', { class: 'cal-tag', text: customerName(hit.customer_id) })
             : null));
      }
      body.appendChild(tr);
    });

    pane.appendChild(h('div', { class: 'table-wrap' },
      h('table', { class: 'cal' }, [h('thead', {}, headRow), body])));

    /* Tổng kết tháng */
    var monthKey = y + '-' + UI.pad2(m + 1);
    var inMonth = state.bookings.filter(function (b) {
      return b.status !== 'huy' &&
             (String(b.start_date).slice(0, 7) === monthKey || String(b.end_date).slice(0, 7) === monthKey);
    });
    pane.appendChild(panel('Tháng này', h('div', { class: 'kpis kpis-sm' }, [
      kpi('Đơn chạm tháng này', String(inMonth.length), 'kể cả đơn vắt qua tháng'),
      kpi('Ngày máy đã bán', String(busyDaysInMonth(y, m)), 'trên ' + (daysInMonth * live.length) + ' ngày máy có thể bán'),
      kpi('Lấp chỗ', Math.round(busyDaysInMonth(y, m) / (daysInMonth * live.length) * 100) + '%', 'tỉ lệ máy có người giữ')
    ])));
  }

  function busyDaysInMonth(y, m) {
    var daysInMonth = new Date(y, m + 1, 0).getDate();
    var live = state.cameras.filter(function (c) { return c.active !== false; });
    var count = 0;
    live.forEach(function (cam) {
      for (var d = 1; d <= daysInMonth; d++) {
        var iso = y + '-' + UI.pad2(m + 1) + '-' + UI.pad2(d);
        var busy = state.bookings.some(function (b) {
          return b.camera_id === cam.id && b.status !== 'huy' && b.start_date <= iso && iso <= b.end_date;
        });
        if (busy) count++;
      }
    });
    return count;
  }

  function shiftMonth(delta) {
    var d = new Date(state.month.y, state.month.m + delta, 1);
    state.month = { y: d.getFullYear(), m: d.getMonth() };
    render();
  }

  /* ═══════════════════════════════════════════════════════════════
     MÀN 4 — Khách
     ═══════════════════════════════════════════════════════════════ */
  function viewCustomers(pane) {
    pane.appendChild(head('Khách', state.customers.length + ' người đã thuê.', [
      h('button', { class: 'btn btn-solid', type: 'button', text: 'Thêm khách', onclick: function () { openCustomer(null); } })
    ]));

    var stats = {};
    state.bookings.forEach(function (b) {
      if (b.status === 'huy') return;
      var s = stats[b.customer_id] || (stats[b.customer_id] = { count: 0, total: 0, last: '' });
      s.count++;
      s.total += b.total || 0;
      if (b.start_date > s.last) s.last = b.start_date;
    });

    pane.appendChild(UI.table([
      { label: 'Tên', cell: function (c) {
          return h('div', { class: 'cell-stack' }, [
            h('b', { text: c.name }),
            c.is_student ? h('span', { class: 'mono', text: 'sinh viên' }) : null
          ]);
        } },
      { label: 'Liên hệ', cell: function (c) {
          return h('div', { class: 'cell-stack' }, [
            h('span', { class: 'mono', text: c.phone || '—' }),
            c.contact_link ? h('span', { class: 'mono dim', text: c.contact_link }) : null
          ]);
        } },
      { label: 'Bảo lãnh', cell: function (c) {
          return c.guarantor_name ? c.guarantor_name + (c.guarantor_phone ? ' · ' + c.guarantor_phone : '') : '—';
        } },
      { label: 'Số lần thuê', align: 'right', cell: function (c) {
          return String((stats[c.id] || {}).count || 0);
        } },
      { label: 'Đã trả', align: 'right', cell: function (c) {
          return UI.money((stats[c.id] || {}).total || 0);
        } },
      { label: 'Lần gần nhất', align: 'right', cell: function (c) {
          var s = stats[c.id];
          return s && s.last ? UI.fmtDateFull(s.last) : '—';
        } }
    ], state.customers, {
      empty: 'Chưa có khách nào. Lập đơn thuê là khách được thêm luôn.',
      onRow: function (c) { openCustomer(c); }
    }));
  }

  function openCustomer(existing) {
    var isNew = !existing;
    var c = existing || { name: '', phone: '', contact_link: '', is_student: false };

    var f = UI.form([
      { name: 'name', label: 'Tên', type: 'text' },
      { name: 'phone', label: 'Số điện thoại', type: 'text' },
      { name: 'contact_link', label: 'Facebook / Zalo / Instagram', type: 'text', wide: true },
      { name: 'is_student', label: 'Là sinh viên', type: 'check', wide: true },
      { type: 'divider', label: 'Người bảo lãnh' },
      { name: 'guarantor_name', label: 'Tên người bảo lãnh', type: 'text' },
      { name: 'guarantor_phone', label: 'Số của người bảo lãnh', type: 'text' },
      { name: 'note', label: 'Ghi chú', type: 'textarea', wide: true, rows: 3 }
    ], c);

    var body = [f.el];

    if (!isNew) {
      var mine = state.bookings.filter(function (b) { return b.customer_id === c.id; });
      body.push(h('div', { class: 'sub-panel' }, [
        h('span', { class: 'mono', text: 'Đã thuê ' + mine.length + ' lần' }),
        mine.length
          ? h('div', { class: 'lines' }, mine.map(function (b) {
              return bookingLine(b, UI.fmtDate(b.start_date) + ' → ' + UI.fmtDate(b.end_date));
            }))
          : emptyNote('Chưa có đơn nào.')
      ]));
    }

    var actions = [{ label: 'Thôi', onClick: function (api) { api.close(); } }];

    if (!isNew) {
      actions.push({
        label: 'Xoá khách', kind: 'danger',
        onClick: function (api) {
          var mine = state.bookings.filter(function (b) { return b.customer_id === c.id; });
          UI.confirm('Xoá khách này?',
            mine.length
              ? c.name + ' còn ' + mine.length + ' đơn trong sổ. Xoá khách thì các đơn đó mất tên người thuê.'
              : 'Xoá ' + c.name + ' khỏi danh sách khách.',
            'Xoá hẳn').then(function (ok) {
              if (!ok) return;
              DB.table('customers').remove(c.id)
                .then(function () { api.close(); UI.toast('Đã xoá khách.'); return reload(['customers', 'bookings']); })
                .catch(fail);
            });
        }
      });
    }

    actions.push({
      label: isNew ? 'Thêm khách' : 'Lưu', kind: 'solid',
      onClick: function (api) {
        var v = f.read();
        if (!v.name) { UI.toast('Khách cần có tên.', 'err'); return; }
        var job = isNew ? DB.table('customers').insert(v) : DB.table('customers').update(c.id, v);
        job.then(function () {
          api.close();
          UI.toast(isNew ? 'Đã thêm khách.' : 'Đã lưu.');
          return reload(['customers']);
        }).catch(fail);
      }
    });

    UI.sheet({
      title: isNew ? 'Khách mới' : c.name,
      eyebrow: 'Khách thuê',
      body: body,
      actions: actions
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     MÀN 5 — Kho máy
     ═══════════════════════════════════════════════════════════════ */
  function viewCameras(pane) {
    pane.appendChild(head('Kho máy', 'Sửa ở đây thì trang giới thiệu đổi theo sau khi bấm xuất file.', [
      h('button', { class: 'btn btn-solid', type: 'button', text: 'Thêm máy', onclick: function () { openCamera(null); } })
    ]));

    if (!state.cameras.length) {
      pane.appendChild(emptyNote('Kho đang trống. Thêm chiếc máy đầu tiên để bắt đầu nhận đơn.'));
      return;
    }

    var today = UI.todayISO();

    pane.appendChild(h('div', { class: 'cards' }, state.cameras.map(function (cam) {
      var busy = state.bookings.filter(function (b) {
        return b.camera_id === cam.id && HOLDS_CAMERA.indexOf(b.status) !== -1 &&
               b.start_date <= today && today <= b.end_date;
      })[0];

      var earned = state.bookings.filter(function (b) {
        return b.camera_id === cam.id && b.status === 'da_tra';
      }).reduce(function (s, b) { return s + (b.total || 0); }, 0);

      return h('article', {
        class: 'card' + (cam.active === false ? ' card-off' : ''),
        tabindex: 0,
        onclick: function () { openCamera(cam); },
        onkeydown: function (e) { if (e.key === 'Enter') openCamera(cam); }
      }, [
        h('div', { class: 'card-top' }, [
          h('span', { class: 'mono', text: cam.code || '—' }),
          cam.featured ? UI.pill('nổi bật', 'magenta') : null,
          cam.active === false ? UI.pill('đã tắt', 'ghost') : null
        ]),
        h('h3', { text: cam.name }),
        h('p', { class: 'card-who', text: cam.who || '' }),
        h('ul', { class: 'card-spec' }, (cam.specs || []).map(function (s) {
          return h('li', {}, [h('span', { text: s.k }), h('b', { text: s.v })]);
        })),
        h('div', { class: 'card-foot' }, [
          h('strong', { text: UI.money(cam.day_rate) + ' / ngày' }),
          busy
            ? UI.pill('đang ở chỗ ' + customerName(busy.customer_id), 'magenta')
            : UI.pill('đang rảnh', 'done')
        ]),
        h('span', { class: 'mono dim', text: 'Đã thu ' + UI.money(earned) + ' từ máy này' })
      ]);
    })));
  }

  function openCamera(existing) {
    var isNew = !existing;
    var cam = existing || {
      code: '', name: '', short: '', badge: '', who: '', specs: [],
      day_rate: 0, featured: false, active: true,
      sort: state.cameras.length + 1
    };

    var f = UI.form([
      { name: 'name', label: 'Tên đầy đủ', type: 'text', placeholder: 'Canon EOS R50',
        hint: 'Trên trang, tên xuống dòng sau từ đầu tiên: "Canon" / "EOS R50".' },
      { name: 'short', label: 'Tên ngắn', type: 'text', placeholder: 'Canon R50',
        hint: 'Dùng cho vòng xoay tính giá, chỗ hẹp.' },
      { name: 'code', label: 'Mã khung', type: 'text', placeholder: '1 ▸ aps-c' },
      { name: 'badge', label: 'Nhãn loại', type: 'text', placeholder: 'APS-C' },
      { name: 'day_rate', label: 'Giá thuê / ngày', type: 'money' },
      { name: 'sort', label: 'Thứ tự hiện', type: 'number' },
      { name: 'who', label: 'Hợp với ai', type: 'textarea', wide: true, rows: 3 },
      { name: 'specs', label: 'Thông số', type: 'pairs', wide: true,
        keyLabel: 'Mục', valLabel: 'Giá trị' },
      { name: 'featured', label: 'Đánh dấu nổi bật (vòng magenta trên trang)', type: 'check', wide: true },
      { name: 'active', label: 'Còn cho thuê — bỏ dấu này thì máy biến khỏi trang giới thiệu', type: 'check', wide: true }
    ], cam);

    var actions = [{ label: 'Thôi', onClick: function (api) { api.close(); } }];

    if (!isNew) {
      actions.push({
        label: 'Xoá máy', kind: 'danger',
        onClick: function (api) {
          var mine = state.bookings.filter(function (b) { return b.camera_id === cam.id; });
          UI.confirm('Xoá máy này?',
            mine.length
              ? cam.name + ' còn dính ' + mine.length + ' đơn. Nếu chỉ muốn ngừng cho thuê thì bỏ dấu "Còn cho thuê" là đủ.'
              : 'Xoá ' + cam.name + ' khỏi kho.',
            'Xoá hẳn').then(function (ok) {
              if (!ok) return;
              DB.table('cameras').remove(cam.id)
                .then(function () { api.close(); UI.toast('Đã xoá máy.'); return reload(['cameras', 'bookings']); })
                .catch(fail);
            });
        }
      });
    }

    actions.push({
      label: isNew ? 'Thêm máy' : 'Lưu', kind: 'solid',
      onClick: function (api) {
        var v = f.read();
        if (!v.name) { UI.toast('Máy cần có tên.', 'err'); return; }
        if (!v.short) v.short = v.name;
        var job = isNew ? DB.table('cameras').insert(v) : DB.table('cameras').update(cam.id, v);
        job.then(function () {
          api.close();
          UI.toast(isNew ? 'Đã thêm máy.' : 'Đã lưu.');
          return reload(['cameras']);
        }).catch(fail);
      }
    });

    UI.sheet({
      title: isNew ? 'Máy mới' : cam.name,
      eyebrow: 'Kho máy',
      body: f.el,
      actions: actions
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     MÀN 6 — Nội dung trang
     ═══════════════════════════════════════════════════════════════ */
  var contentForms = [];

  function viewContent(pane) {
    contentForms = [];
    var c = state.content;

    pane.appendChild(head('Nội dung trang',
      'Sửa xong bấm Lưu, rồi bấm Xuất index.html và commit file nhận được.', [
      h('button', { class: 'btn btn-ghost', type: 'button', text: 'Xem trang hiện tại',
        onclick: function () { window.open('index.html', '_blank', 'noopener'); } })
    ]));

    var warns = Content.warnings(c, state.cameras);
    if (warns.length) {
      pane.appendChild(h('section', { class: 'panel panel-warn' }, [
        h('div', { class: 'panel-head' }, h('span', { class: 'mono', text: 'Còn phải điền' })),
        h('ul', { class: 'warn-list' }, warns.map(function (w) { return h('li', { text: w }); }))
      ]));
    }

    /* — Liên hệ và giao nhận — */
    pane.appendChild(contentGroup('Liên hệ và giao nhận', UI.form([
      { name: 'phone', label: 'Số điện thoại (dùng cho link gọi)', type: 'text', placeholder: '+84912345678',
        hint: 'Viết liền, có mã nước. Đây là số nút "Nhắn giữ máy" bấm vào.' },
      { name: 'phoneText', label: 'Số hiện ở chân trang', type: 'text', placeholder: '0912 345 678' },
      { name: 'navCta', label: 'Chữ trên nút ở thanh trên', type: 'text' },
      { name: 'socialText', label: 'Chữ liên kết mạng xã hội', type: 'text' },
      { name: 'socialUrl', label: 'Địa chỉ mạng xã hội', type: 'text', placeholder: 'https://facebook.com/…', wide: true },
      { type: 'divider', label: 'Giao nhận' },
      { name: 'area', label: 'Khu vực giao nhận', type: 'text', wide: true, placeholder: 'Khu vực: Cầu Giấy, Đống Đa' },
      { name: 'hours', label: 'Giờ giấc', type: 'text', wide: true }
    ], Object.assign({}, c.contact, c.delivery)), function (v) {
      c.contact.phone = v.phone;
      c.contact.phoneText = v.phoneText;
      c.contact.navCta = v.navCta;
      c.contact.socialText = v.socialText;
      c.contact.socialUrl = v.socialUrl;
      c.delivery.area = v.area;
      c.delivery.hours = v.hours;
    }));

    /* — Hero — */
    pane.appendChild(contentGroup('Màn hình đầu', UI.form([
      { name: 'eyebrow', label: 'Dòng nhỏ trên tiêu đề', type: 'text', wide: true },
      { name: 'title', label: 'Tiêu đề lớn', type: 'textarea', rows: 2, wide: true,
        hint: 'Xuống dòng để ngắt hàng. Bọc **hai dấu sao** để chữ đó thành màu magenta.' },
      { name: 'sub', label: 'Đoạn giới thiệu', type: 'textarea', rows: 3, wide: true },
      { name: 'ctaPrimary', label: 'Nút chính', type: 'text' },
      { name: 'ctaSecondary', label: 'Nút phụ', type: 'text' },
      { name: 'caption', label: 'Chú thích dưới ảnh máy', type: 'text', wide: true },
      { name: 'facts', label: 'Ba điểm nhanh dưới nút', type: 'pairs', wide: true,
        keyLabel: 'Tiêu đề', valLabel: 'Diễn giải' },
      { type: 'divider', label: 'Dải thông số đáy khung ngắm' },
      { name: 'aperture', label: 'Khẩu độ', type: 'text' },
      { name: 'camera', label: 'Tên máy', type: 'text' },
      { name: 'lens', label: 'Ống kính', type: 'text' },
      { name: 'status', label: 'Trạng thái', type: 'text' }
    ], Object.assign({}, c.hero, c.hero.hud)), function (v) {
      ['eyebrow', 'title', 'sub', 'ctaPrimary', 'ctaSecondary', 'caption', 'facts'].forEach(function (k) {
        c.hero[k] = v[k];
      });
      c.hero.hud = { aperture: v.aperture, camera: v.camera, lens: v.lens, status: v.status };
    }));

    /* — Kho máy (phần chữ) — */
    pane.appendChild(contentGroup('Mục kho máy', UI.form([
      { name: 'title', label: 'Tiêu đề mục', type: 'text' },
      { name: 'sub', label: 'Câu dẫn', type: 'text', wide: true },
      { name: 'footLeft', label: 'Ghi chú trái', type: 'text', wide: true },
      { name: 'footRight', label: 'Ghi chú phải', type: 'text', wide: true }
    ], c.fleet), function (v) { Object.assign(c.fleet, v); },
      'Thông số và giá từng máy nằm ở màn Kho máy.'));

    /* — Tính giá — */
    pane.appendChild(contentGroup('Mục tính giá', UI.form([
      { name: 'title', label: 'Tiêu đề mục', type: 'textarea', rows: 2 },
      { name: 'sub', label: 'Câu dẫn', type: 'text', wide: true },
      { name: 'days', label: 'Các nấc số ngày', type: 'text', wide: true,
        hint: 'Cách nhau bằng dấu phẩy. Đây là các nấc trên vòng xoay.' },
      { name: 'tiers', label: 'Mốc giảm giá', type: 'pairs', wide: true,
        keyLabel: 'Từ ? ngày', valLabel: 'Giảm ?%' },
      { name: 'note', label: 'Ghi chú dưới ô tiền', type: 'textarea', rows: 2, wide: true },
      { type: 'divider', label: 'Cột bên phải' },
      { name: 'sideTitle', label: 'Tiêu đề cột', type: 'textarea', rows: 2 },
      { name: 'sideSub', label: 'Câu dẫn cột', type: 'textarea', rows: 2 },
      { name: 'includes', label: 'Những thứ đã gồm trong giá', type: 'pairs', wide: true,
        keyLabel: 'Mục', valLabel: 'Ghi chú' },
      { name: 'sideCta', label: 'Nút cuối cột', type: 'text' },
      { type: 'divider', label: 'Nhãn trên nắp máy' },
      { name: 'plateLeft', label: 'Nhãn trái', type: 'text' },
      { name: 'plateRight', label: 'Nhãn phải', type: 'text' }
    ], Object.assign({}, c.calc, {
      days: (c.calc.days || []).join(', '),
      tiers: (c.calc.tiers || []).map(function (t) { return { k: String(t.days), v: String(t.percent) }; })
    })), function (v) {
      Object.assign(c.calc, v);
      c.calc.days = String(v.days).split(',')
        .map(function (s) { return parseInt(s.trim(), 10); })
        .filter(function (n) { return n > 0; });
      if (!c.calc.days.length) c.calc.days = [1, 2, 3, 5, 7, 14, 30];
      c.calc.tiers = (v.tiers || []).map(function (p) {
        return { days: parseInt(p.k, 10) || 0, percent: parseInt(p.v, 10) || 0 };
      }).filter(function (t) { return t.days > 0 && t.percent > 0; });
    }));

    /* — Các mục dạng danh sách — */
    pane.appendChild(listGroup('Mục cách thuê', c.steps, [
      { name: 'label', label: 'Nhãn nhỏ', type: 'text' },
      { name: 'title', label: 'Tiêu đề (xuống dòng được)', type: 'textarea', rows: 2 },
      { name: 'body', label: 'Nội dung', type: 'textarea', rows: 3, wide: true }
    ], function (it) { return it.label + ' · ' + String(it.title).replace(/\n/g, ' '); }));

    pane.appendChild(listGroup('Mục tiền cọc', c.deposits, [
      { name: 'label', label: 'Nhãn nhỏ', type: 'text' },
      { name: 'title', label: 'Tiêu đề (xuống dòng được)', type: 'textarea', rows: 2 },
      { name: 'body', label: 'Nội dung', type: 'textarea', rows: 3, wide: true }
    ], function (it) { return it.label + ' · ' + String(it.title).replace(/\n/g, ' '); }, [
      { name: 'noteLabel', label: 'Nhãn khối ghi chú cuối mục', type: 'text' },
      { name: 'noteBody', label: 'Nội dung khối ghi chú', type: 'textarea', rows: 3, wide: true }
    ]));

    pane.appendChild(listGroup('Mục minh bạch', c.trust, [
      { name: 'title', label: 'Tiêu đề', type: 'textarea', rows: 2, wide: true,
        hint: 'Xuống dòng để ngắt hàng. **Hai dấu sao** làm chữ đó thành màu hổ phách.' },
      { name: 'body', label: 'Nội dung', type: 'textarea', rows: 3, wide: true }
    ], function (it) { return String(it.title).replace(/\n/g, ' ').replace(/\*\*/g, ''); }));

    pane.appendChild(listGroup('Mục hỏi đáp', c.faq, [
      { name: 'q', label: 'Câu hỏi', type: 'text', wide: true },
      { name: 'a', label: 'Câu trả lời', type: 'textarea', rows: 4, wide: true }
    ], function (it) { return it.q; }));

    /* — Chân trang — */
    pane.appendChild(contentGroup('Chân trang', UI.form([
      { name: 'cta', label: 'Câu lớn', type: 'textarea', rows: 2, wide: true },
      { name: 'ctaButton', label: 'Chữ trên nút', type: 'text' },
      { name: 'deliveryLabel', label: 'Nhãn cột giao nhận', type: 'text' },
      { name: 'contactLabel', label: 'Nhãn cột liên hệ', type: 'text' },
      { name: 'brandLine', label: 'Dòng cuối bên trái', type: 'text' },
      { name: 'priceLine', label: 'Dòng cuối bên phải', type: 'text' }
    ], c.footer), function (v) { Object.assign(c.footer, v); }));

    /* — Thanh lưu và xuất — */
    pane.appendChild(h('div', { class: 'sticky-bar' }, [
      h('span', { class: 'mono', text: DB.isRemote() ? 'Lưu về Supabase' : 'Lưu vào máy này' }),
      h('button', { class: 'btn btn-ghost', type: 'button', text: 'Lưu nội dung', onclick: saveContent }),
      h('button', { class: 'btn btn-solid', type: 'button', text: 'Xuất index.html', onclick: exportSite })
    ]));
  }

  // Gom giá trị của mọi biểu mẫu con vào state.content rồi ghi xuống
  function collectContent() {
    contentForms.forEach(function (entry) { entry.apply(entry.form.read()); });
  }

  function saveContent() {
    collectContent();
    return DB.content.save(state.content)
      .then(function () { UI.toast('Đã lưu nội dung.'); render(); })
      .catch(fail);
  }

  function contentGroup(title, form, apply, note) {
    contentForms.push({ form: form, apply: apply });
    return h('details', { class: 'group' }, [
      h('summary', {}, h('span', { class: 'mono', text: title })),
      note ? h('p', { class: 'hint', text: note }) : null,
      form.el
    ]);
  }

  /* Khối danh sách: thêm, bớt, đổi thứ tự các mục lặp lại */
  function listGroup(title, model, fields, labelOf, extraFields) {
    var host = h('div', { class: 'list-items' });

    var headForm = UI.form([
      { name: 'title', label: 'Tiêu đề mục', type: 'textarea', rows: 2 },
      { name: 'sub', label: 'Câu dẫn', type: 'text', wide: true }
    ].concat(extraFields || []), model);

    function draw() {
      UI.clear(host);
      model.items.forEach(function (item, i) {
        var f = UI.form(fields, item);
        itemForms.push({ form: f, index: i });

        host.appendChild(h('div', { class: 'list-item' }, [
          h('div', { class: 'list-item-head' }, [
            h('span', { class: 'mono', text: (i + 1) + ' · ' + labelOf(item) }),
            h('span', { class: 'list-tools' }, [
              h('button', { class: 'tool', type: 'button', title: 'Lên', text: '↑', disabled: i === 0,
                onclick: function () { commit(); move(i, -1); } }),
              h('button', { class: 'tool', type: 'button', title: 'Xuống', text: '↓', disabled: i === model.items.length - 1,
                onclick: function () { commit(); move(i, 1); } }),
              h('button', { class: 'tool tool-x', type: 'button', title: 'Bỏ mục này', text: '✕',
                onclick: function () { commit(); model.items.splice(i, 1); redraw(); } })
            ])
          ]),
          f.el
        ]));
      });

      host.appendChild(h('button', {
        class: 'btn btn-ghost btn-sm', type: 'button', text: '+ Thêm mục',
        onclick: function () {
          commit();
          var blank = {};
          fields.forEach(function (fd) { if (fd.name) blank[fd.name] = ''; });
          model.items.push(blank);
          redraw();
        }
      }));
    }

    var itemForms = [];

    function commit() {
      itemForms.forEach(function (entry) {
        Object.assign(model.items[entry.index], entry.form.read());
      });
    }
    function move(i, delta) {
      var j = i + delta;
      if (j < 0 || j >= model.items.length) return;
      var tmp = model.items[i];
      model.items[i] = model.items[j];
      model.items[j] = tmp;
      redraw();
    }
    function redraw() { itemForms = []; draw(); }

    redraw();

    contentForms.push({
      form: headForm,
      apply: function (v) { Object.assign(model, v); commit(); }
    });

    return h('details', { class: 'group' }, [
      h('summary', {}, h('span', { class: 'mono', text: title })),
      headForm.el,
      host
    ]);
  }

  /* ── Xuất file index.html ── */
  function exportSite() {
    collectContent();

    DB.content.save(state.content)
      .then(function () { return fetch('index.html', { cache: 'no-store' }); })
      .then(function (res) {
        if (!res.ok) throw new Error('Không đọc được index.html (' + res.status + ').');
        return res.text();
      })
      .then(function (src) {
        var out = Content.render(src, state.content, state.cameras);
        UI.download('index.html', out, 'text/html');
        UI.toast('Đã xuất index.html — thay file cũ rồi commit là xong.');
      })
      .catch(function (err) {
        if (err instanceof TypeError) {
          UI.toast('Không lấy được index.html. Trang quản trị cần chạy qua máy chủ cục bộ, không mở bằng file://', 'err');
          return;
        }
        fail(err);
      });
  }

  /* ═══════════════════════════════════════════════════════════════
     MÀN 7 — Cài đặt
     ═══════════════════════════════════════════════════════════════ */
  function viewSettings(pane) {
    pane.appendChild(head('Cài đặt', 'Kết nối, sao lưu, và đăng xuất.'));

    var cfg = DB.getConfig();
    pane.appendChild(panel('Nơi cất dữ liệu', h('div', { class: 'settings-block' }, [
      h('p', {}, [
        h('b', { text: DB.isRemote() ? 'Supabase' : 'Chế độ máy này' }),
        h('span', { text: DB.isRemote()
          ? ' — dữ liệu nằm trên dự án của bạn, mở máy nào cũng thấy.'
          : ' — dữ liệu nằm trong trình duyệt máy đang mở.' })
      ]),
      cfg ? h('p', { class: 'mono dim', text: cfg.url }) : null,
      h('div', { class: 'row-btns' }, [
        h('button', { class: 'btn btn-ghost btn-sm', type: 'button',
          text: DB.isRemote() ? 'Đổi kết nối' : 'Nối Supabase', onclick: openConfigSheet }),
        DB.isRemote() ? h('button', {
          class: 'btn btn-ghost btn-sm', type: 'button', text: 'Đăng xuất',
          onclick: function () {
            DB.signOut().then(function () { renderLogin('Đã đăng xuất.'); });
          }
        }) : null
      ])
    ])));

    pane.appendChild(panel('Sao lưu', h('div', { class: 'settings-block' }, [
      h('p', { text: 'Xuất toàn bộ kho máy, khách, đơn thuê và nội dung trang ra một file JSON. Dùng để giữ bản phòng thân, hoặc chuyển dữ liệu từ chế độ máy này lên Supabase.' }),
      h('div', { class: 'row-btns' }, [
        h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: 'Xuất bản sao lưu',
          onclick: function () {
            DB.exportAll().then(function (dump) {
              UI.download('nem-shop-' + UI.todayISO() + '.json', JSON.stringify(dump, null, 2), 'application/json');
              UI.toast('Đã xuất bản sao lưu.');
            }).catch(fail);
          } }),
        h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: 'Nhập bản sao lưu',
          onclick: function () {
            UI.pickFile('application/json,.json').then(function (file) {
              if (!file) return;
              var dump;
              try { dump = JSON.parse(file.text); }
              catch (e) { UI.toast('File không phải JSON hợp lệ.', 'err'); return; }

              UI.confirm('Nhập bản sao lưu?',
                'Các bản ghi trùng mã sẽ bị ghi đè bằng dữ liệu trong file. Nên xuất một bản sao lưu hiện tại trước khi làm.',
                'Nhập vào').then(function (ok) {
                  if (!ok) return;
                  DB.importAll(dump).then(function (counts) {
                    UI.toast('Đã nhập ' + counts.cameras + ' máy, ' + counts.customers + ' khách, ' + counts.bookings + ' đơn.');
                    return loadAll().then(render);
                  }).catch(fail);
                });
            });
          } })
      ])
    ])));

    pane.appendChild(panel('Cách dùng', h('div', { class: 'settings-block' }, [
      h('ol', { class: 'steps-list' }, [
        h('li', { text: 'Nhận đơn: vào Đơn thuê ▸ Đơn thuê mới. Trùng lịch máy sẽ bị chặn ngay lúc lưu.' }),
        h('li', { text: 'Giao máy: mở đơn, đổi trạng thái sang Đang thuê.' }),
        h('li', { text: 'Nhận lại máy: đổi sang Đã trả và tích Đã trả cọc. Doanh thu tính từ lúc đó.' }),
        h('li', { text: 'Đổi giá hoặc chữ trên trang: sửa ở Kho máy / Nội dung trang, bấm Lưu, rồi Xuất index.html và commit file mới.' })
      ])
    ])));
  }

  function openConfigSheet() {
    var cfg = DB.getConfig() || { url: '', key: '' };

    var f = UI.form([
      { name: 'url', label: 'Địa chỉ dự án', type: 'text', wide: true,
        placeholder: 'https://xxxxxxxx.supabase.co',
        hint: 'Supabase ▸ Project Settings ▸ Data API ▸ Project URL' },
      { name: 'key', label: 'Khoá anon (public)', type: 'textarea', rows: 3, wide: true,
        hint: 'Cùng trang đó, mục API Keys ▸ anon public. Khoá này công khai được — RLS mới là thứ canh cửa.' }
    ], cfg);

    UI.sheet({
      title: 'Kết nối Supabase',
      eyebrow: 'Cài đặt',
      body: [
        f.el,
        h('p', { class: 'hint', text: 'Chưa có dự án? Bỏ trống và bấm "Dùng chế độ máy này" — mọi thứ chạy trong trình duyệt, khi nào sẵn sàng thì xuất sao lưu rồi nhập lên Supabase.' })
      ],
      actions: [
        { label: 'Thôi', onClick: function (api) { api.close(); } },
        { label: 'Dùng chế độ máy này', onClick: function (api) {
            DB.clearConfig();
            api.close();
            UI.toast('Đang chạy bằng dữ liệu trong máy này.');
            boot();
          } },
        { label: 'Lưu và đăng nhập', kind: 'solid', onClick: function (api) {
            var v = f.read();
            try { DB.setConfig(v.url, v.key); }
            catch (e) { UI.toast(e.message, 'err'); return; }
            api.close();
            renderLogin('Đã lưu kết nối. Đăng nhập bằng tài khoản bạn tạo trong Supabase ▸ Authentication ▸ Users.');
          } }
      ]
    });
  }

  boot();
})();
