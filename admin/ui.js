/* ═══════════════════════════════════════════════════════════════
   NEM shop — tiện ích dựng giao diện

   Không có khuôn mẫu chuỗi nào ở đây dựng HTML từ dữ liệu người dùng:
   mọi thứ đi qua createElement và textContent, nên tên khách hay ghi
   chú có dấu ngoặc nhọn cũng không thể trở thành thẻ HTML.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  /* ── Dựng phần tử ──────────────────────────────────────────── */
  function h(tag, props, kids) {
    var el = document.createElement(tag);

    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'html') el.innerHTML = v;               // chỉ dùng cho chuỗi cố định trong mã
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') {
          el.addEventListener(k.slice(2).toLowerCase(), v);
        }
        else if (k in el && k !== 'list' && typeof v !== 'object') el[k] = v;
        else el.setAttribute(k, v);
      });
    }

    append(el, kids);
    return el;
  }

  function append(parent, kids) {
    if (kids === null || kids === undefined || kids === false) return parent;
    if (Array.isArray(kids)) {
      kids.forEach(function (k) { append(parent, k); });
      return parent;
    }
    parent.appendChild(kids.nodeType ? kids : document.createTextNode(String(kids)));
    return parent;
  }

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

  /* ── Số và tiền ────────────────────────────────────────────── */
  function vnd(n) {
    n = Number(n) || 0;
    return Math.round(n).toLocaleString('vi-VN');
  }
  function money(n) { return vnd(n) + ' đ'; }

  // Chấp nhận "200.000", "200000", "200 000đ" — người nhập kiểu nào cũng hiểu
  function parseMoney(s) {
    if (typeof s === 'number') return Math.round(s);
    var digits = String(s || '').replace(/[^\d]/g, '');
    return digits ? parseInt(digits, 10) : 0;
  }

  /* ── Ngày tháng ────────────────────────────────────────────── */
  // Dùng chuỗi "YYYY-MM-DD" xuyên suốt. Không đụng tới múi giờ nên
  // không bao giờ gặp cảnh đơn thuê lùi một ngày.
  function todayISO() {
    var d = new Date();
    return [d.getFullYear(),
            pad2(d.getMonth() + 1),
            pad2(d.getDate())].join('-');
  }
  function pad2(n) { return String(n).padStart(2, '0'); }

  function parseISO(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3]);
  }
  function toISO(d) {
    return [d.getFullYear(), pad2(d.getMonth() + 1), pad2(d.getDate())].join('-');
  }
  function addDays(iso, n) {
    var d = parseISO(iso);
    if (!d) return iso;
    d.setDate(d.getDate() + n);
    return toISO(d);
  }
  // Số ngày thuê, tính cả ngày nhận lẫn ngày trả: 12/8 → 12/8 là 1 ngày.
  function spanDays(startISO, endISO) {
    var a = parseISO(startISO), b = parseISO(endISO);
    if (!a || !b) return 0;
    return Math.round((b - a) / 86400000) + 1;
  }
  function overlaps(aStart, aEnd, bStart, bEnd) {
    return aStart <= bEnd && bStart <= aEnd;
  }
  function fmtDate(iso) {
    var d = parseISO(iso);
    return d ? pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) : '—';
  }
  function fmtDateFull(iso) {
    var d = parseISO(iso);
    return d ? pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear() : '—';
  }
  function monthLabel(y, m) { return 'Tháng ' + (m + 1) + ' · ' + y; }

  /* ── Lời nhắn thoáng qua ───────────────────────────────────── */
  var toastHost = null;
  function toast(msg, kind) {
    if (!toastHost) {
      toastHost = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
      document.body.appendChild(toastHost);
    }
    var t = h('div', { class: 'toast' + (kind ? ' toast-' + kind : ''), text: msg });
    toastHost.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('in'); });
    setTimeout(function () {
      t.classList.remove('in');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 320);
    }, kind === 'err' ? 5200 : 2800);
  }

  /* ── Ngăn kéo bên phải: nơi mọi biểu mẫu xuất hiện ─────────── */
  var openSheet = null;

  function sheet(opts) {
    if (openSheet) openSheet.close();

    var body = h('div', { class: 'sheet-body' });
    var foot = h('div', { class: 'sheet-foot' });

    var panel = h('div', {
      class: 'sheet-panel', role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.title
    }, [
      h('div', { class: 'sheet-head' }, [
        h('div', {}, [
          h('span', { class: 'mono', text: opts.eyebrow || 'NEM shop' }),
          h('h2', { text: opts.title })
        ]),
        h('button', { class: 'sheet-x', type: 'button', 'aria-label': 'Đóng', text: '✕', onclick: close })
      ]),
      body,
      foot
    ]);

    var back = h('div', { class: 'sheet-back', onclick: function (e) { if (e.target === back) close(); } }, panel);

    append(body, opts.body);
    (opts.actions || []).forEach(function (a) {
      foot.appendChild(h('button', {
        class: 'btn ' + (a.kind === 'solid' ? 'btn-solid' : a.kind === 'danger' ? 'btn-danger' : 'btn-ghost'),
        type: 'button', text: a.label, onclick: function () { a.onClick(api); }
      }));
    });

    function onKey(e) { if (e.key === 'Escape') close(); }

    function close() {
      document.removeEventListener('keydown', onKey);
      if (back.parentNode) back.parentNode.removeChild(back);
      document.body.classList.remove('sheet-open');
      if (openSheet === api) openSheet = null;
      if (opts.onClose) opts.onClose();
    }

    document.addEventListener('keydown', onKey);
    document.body.appendChild(back);
    document.body.classList.add('sheet-open');
    requestAnimationFrame(function () { back.classList.add('in'); });

    var focusable = panel.querySelector('input,select,textarea,button:not(.sheet-x)');
    if (focusable) focusable.focus();

    var api = { close: close, el: panel, body: body };
    openSheet = api;
    return api;
  }

  function confirmBox(title, message, danger) {
    return new Promise(function (resolve) {
      var settled = false;
      var s = sheet({
        title: title,
        eyebrow: 'Xác nhận',
        body: h('p', { class: 'sheet-msg', text: message }),
        actions: [
          { label: 'Thôi', onClick: function (api) { api.close(); } },
          {
            label: danger || 'Đồng ý', kind: 'danger',
            onClick: function (api) { settled = true; api.close(); resolve(true); }
          }
        ],
        onClose: function () { if (!settled) resolve(false); }
      });
      return s;
    });
  }

  /* ── Biểu mẫu ──────────────────────────────────────────────────
     Khai báo danh sách trường, nhận lại phần tử và hàm đọc giá trị.
     type: text | textarea | number | money | date | select | check | pairs
     ───────────────────────────────────────────────────────────── */
  function form(fields, values) {
    values = values || {};
    var inputs = {};
    var wrap = h('div', { class: 'form' });

    fields.forEach(function (f) {
      if (f.type === 'divider') {
        wrap.appendChild(h('div', { class: 'form-divider' }, h('span', { class: 'mono', text: f.label })));
        return;
      }

      var id = 'f-' + f.name;
      var val = values[f.name];
      var input;

      if (f.type === 'textarea') {
        input = h('textarea', { id: id, rows: f.rows || 3, placeholder: f.placeholder || '' });
        input.value = val === undefined || val === null ? '' : String(val);
      } else if (f.type === 'select') {
        input = h('select', { id: id });
        (f.options || []).forEach(function (o) {
          input.appendChild(h('option', { value: o.value, text: o.label }));
        });
        input.value = val === undefined || val === null ? '' : String(val);
      } else if (f.type === 'check') {
        input = h('input', { id: id, type: 'checkbox' });
        input.checked = !!val;
      } else if (f.type === 'pairs') {
        input = pairsEditor(val || [], f);
      } else {
        input = h('input', {
          id: id,
          type: f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text',
          inputmode: f.type === 'money' ? 'numeric' : null,
          placeholder: f.placeholder || '',
          min: f.min, max: f.max, step: f.step
        });
        input.value = f.type === 'money' ? (val ? vnd(val) : '')
                    : val === undefined || val === null ? '' : String(val);
        if (f.type === 'money') {
          input.addEventListener('blur', function () {
            input.value = input.value.trim() ? vnd(parseMoney(input.value)) : '';
          });
        }
      }

      if (f.onInput) input.addEventListener('input', f.onInput);
      if (f.type === 'check') input.addEventListener('change', function () { if (f.onChange) f.onChange(); });
      else if (f.onChange) input.addEventListener('change', f.onChange);

      inputs[f.name] = { el: input, spec: f };

      var row = h('div', { class: 'field' + (f.wide ? ' field-wide' : '') });
      if (f.type === 'check') {
        row.appendChild(h('label', { class: 'check', for: id }, [input, h('span', { text: f.label })]));
      } else {
        row.appendChild(h('label', { class: 'mono', for: id, text: f.label }));
        row.appendChild(input);
      }
      if (f.hint) row.appendChild(h('small', { class: 'hint', text: f.hint }));
      wrap.appendChild(row);
    });

    function read() {
      var out = {};
      Object.keys(inputs).forEach(function (name) {
        var entry = inputs[name];
        var t = entry.spec.type;
        if (t === 'check') out[name] = entry.el.checked;
        else if (t === 'money') out[name] = parseMoney(entry.el.value);
        else if (t === 'number') out[name] = entry.el.value === '' ? 0 : Number(entry.el.value);
        else if (t === 'pairs') out[name] = entry.el.readPairs();
        else out[name] = entry.el.value.trim();
      });
      return out;
    }

    function get(name) {
      var entry = inputs[name];
      if (!entry) return null;
      var t = entry.spec.type;
      if (t === 'check') return entry.el.checked;
      if (t === 'money') return parseMoney(entry.el.value);
      if (t === 'number') return entry.el.value === '' ? 0 : Number(entry.el.value);
      if (t === 'pairs') return entry.el.readPairs();
      return entry.el.value.trim();
    }

    function set(name, value) {
      var entry = inputs[name];
      if (!entry) return;
      if (entry.spec.type === 'check') entry.el.checked = !!value;
      else if (entry.spec.type === 'money') entry.el.value = value ? vnd(value) : '';
      else entry.el.value = value === null || value === undefined ? '' : String(value);
    }

    function missing(names) {
      return names.filter(function (n) {
        var v = get(n);
        return v === '' || v === null || v === undefined;
      });
    }

    return { el: wrap, read: read, get: get, set: set, missing: missing, inputs: inputs };
  }

  /* Bộ sửa danh sách cặp nhãn–giá trị (thông số máy, mục đã bao gồm…) */
  function pairsEditor(pairs, spec) {
    var list = h('div', { class: 'pairs' });

    function addRow(p) {
      var kIn = h('input', { type: 'text', placeholder: spec.keyLabel || 'Nhãn', value: p ? p.k : '' });
      var vIn = h('input', { type: 'text', placeholder: spec.valLabel || 'Giá trị', value: p ? p.v : '' });
      var row = h('div', { class: 'pair' }, [
        kIn, vIn,
        h('button', {
          class: 'pair-x', type: 'button', title: 'Bỏ dòng này', text: '✕',
          onclick: function () { list.removeChild(row); }
        })
      ]);
      list.appendChild(row);
    }

    (pairs || []).forEach(addRow);

    var box = h('div', { class: 'pairs-box' }, [
      list,
      h('button', {
        class: 'btn btn-ghost btn-sm', type: 'button', text: '+ Thêm dòng',
        onclick: function () { addRow(null); }
      })
    ]);

    box.readPairs = function () {
      return Array.prototype.map.call(list.querySelectorAll('.pair'), function (row) {
        var ins = row.querySelectorAll('input');
        return { k: ins[0].value.trim(), v: ins[1].value.trim() };
      }).filter(function (p) { return p.k || p.v; });
    };

    return box;
  }

  /* ── Bảng ──────────────────────────────────────────────────── */
  function tableView(columns, rows, opts) {
    opts = opts || {};
    var head = h('tr', {}, columns.map(function (c) {
      return h('th', { class: c.align === 'right' ? 'ta-r' : null, text: c.label });
    }));

    var body = h('tbody');
    if (!rows.length) {
      body.appendChild(h('tr', {}, h('td', {
        class: 'empty', colSpan: columns.length, text: opts.empty || 'Chưa có gì ở đây.'
      })));
    } else {
      rows.forEach(function (row, i) {
        var tr = h('tr', {
          class: opts.rowClass ? opts.rowClass(row) : null,
          tabindex: opts.onRow ? 0 : null,
          onclick: opts.onRow ? function () { opts.onRow(row); } : null,
          onkeydown: opts.onRow ? function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opts.onRow(row); }
          } : null
        });
        columns.forEach(function (c) {
          var cell = h('td', { class: c.align === 'right' ? 'ta-r' : null });
          append(cell, c.cell(row, i));
          tr.appendChild(cell);
        });
        body.appendChild(tr);
      });
    }

    return h('div', { class: 'table-wrap' },
      h('table', { class: 'table' + (opts.onRow ? ' table-click' : '') }, [h('thead', {}, head), body]));
  }

  function pill(text, kind) {
    return h('span', { class: 'pill' + (kind ? ' pill-' + kind : ''), text: text });
  }

  /* ── Tải file xuống ────────────────────────────────────────── */
  function download(filename, text, mime) {
    var blob = new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = h('a', { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function pickFile(accept) {
    return new Promise(function (resolve) {
      var input = h('input', { type: 'file', accept: accept || '', style: { display: 'none' } });
      input.addEventListener('change', function () {
        var file = input.files && input.files[0];
        document.body.removeChild(input);
        if (!file) { resolve(null); return; }
        var reader = new FileReader();
        reader.onload = function () { resolve({ name: file.name, text: String(reader.result) }); };
        reader.onerror = function () { resolve(null); };
        reader.readAsText(file);
      });
      document.body.appendChild(input);
      input.click();
    });
  }

  global.UI = {
    h: h, append: append, clear: clear,
    vnd: vnd, money: money, parseMoney: parseMoney,
    todayISO: todayISO, parseISO: parseISO, toISO: toISO, addDays: addDays,
    spanDays: spanDays, overlaps: overlaps,
    fmtDate: fmtDate, fmtDateFull: fmtDateFull, monthLabel: monthLabel, pad2: pad2,
    toast: toast, sheet: sheet, confirm: confirmBox,
    form: form, table: tableView, pill: pill,
    download: download, pickFile: pickFile
  };
})(window);
