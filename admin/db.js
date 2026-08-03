/* ═══════════════════════════════════════════════════════════════
   NEM shop — tầng dữ liệu

   Hai chế độ chạy, cùng một giao diện gọi hàm:

   • "supabase" — nói chuyện thẳng với Supabase qua HTTP. Không nạp thư
     viện ngoài nào: PostgREST và GoTrue đều là API HTTP bình thường,
     fetch là đủ. Giữ đúng tinh thần của repo này.
   • "local"    — chưa khai báo Supabase thì mọi thứ nằm trong
     localStorage của máy đang mở. Dùng để xem thử trước khi lập dự án
     thật, và để không bao giờ gặp màn hình trắng.

   Khoá anon của Supabase là khoá công khai, đưa lên repo cũng được;
   thứ thật sự canh cửa là RLS và đăng nhập trong schema.sql.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var CFG_KEY = 'nem.admin.config';
  var SESSION_KEY = 'nem.admin.session';
  var LOCAL_PREFIX = 'nem.admin.local.';

  var TABLES = ['cameras', 'customers', 'bookings'];

  /* ── Kho lưu nhỏ, bọc lại để localStorage bị chặn cũng không vỡ ── */
  function read(key, fallback) {
    try {
      var raw = global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { global.localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }
  function drop(key) {
    try { global.localStorage.removeItem(key); } catch (e) {}
  }

  function uid() {
    if (global.crypto && global.crypto.randomUUID) return global.crypto.randomUUID();
    return 'id-' + Math.abs(Date.now() ^ (performance.now() * 1e6 | 0)).toString(36) +
           '-' + (localSeq++).toString(36);
  }
  var localSeq = 0;

  /* ═══════════════════════════════════════════════════════════════
     Cấu hình
     ═══════════════════════════════════════════════════════════════ */
  var config = read(CFG_KEY, null);

  // Nếu có file admin/config.js đặt sẵn window.NEM_SUPABASE thì dùng luôn,
  // khỏi phải dán lại URL và khoá trên từng máy.
  if (!config && global.NEM_SUPABASE && global.NEM_SUPABASE.url) {
    config = {
      url: String(global.NEM_SUPABASE.url).replace(/\/+$/, ''),
      key: global.NEM_SUPABASE.key || ''
    };
  }

  function isRemote() { return !!(config && config.url && config.key); }
  function mode() { return isRemote() ? 'supabase' : 'local'; }

  function setConfig(url, key) {
    url = String(url || '').trim().replace(/\/+$/, '');
    key = String(key || '').trim();
    if (!url || !key) throw new Error('Cần cả địa chỉ dự án và khoá anon.');
    if (!/^https?:\/\//.test(url)) throw new Error('Địa chỉ dự án phải bắt đầu bằng https://');
    config = { url: url, key: key };
    write(CFG_KEY, config);
    session = null;
    drop(SESSION_KEY);
  }

  function clearConfig() {
    config = null;
    session = null;
    drop(CFG_KEY);
    drop(SESSION_KEY);
  }

  /* ═══════════════════════════════════════════════════════════════
     Phiên đăng nhập
     ═══════════════════════════════════════════════════════════════ */
  var session = read(SESSION_KEY, null);
  var refreshing = null;

  function currentUser() {
    if (!isRemote()) return { email: 'máy này', local: true };
    return session && session.user ? session.user : null;
  }

  function saveSession(payload) {
    if (!payload || !payload.access_token) throw new Error('Máy chủ trả về phiên không hợp lệ.');
    session = {
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      // expires_in tính bằng giây; trừ hao 60s để không dùng vé sát giờ hết hạn
      expires_at: Date.now() + ((payload.expires_in || 3600) - 60) * 1000,
      user: payload.user ? { id: payload.user.id, email: payload.user.email } : null
    };
    write(SESSION_KEY, session);
    return session;
  }

  function authFetch(path, body) {
    return fetch(config.url + '/auth/v1/' + path, {
      method: 'POST',
      headers: { apikey: config.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    }).then(readJson);
  }

  function readJson(res) {
    return res.text().then(function (text) {
      var data = null;
      if (text) { try { data = JSON.parse(text); } catch (e) { data = { raw: text }; } }
      if (res.ok) return data;

      var msg = (data && (data.error_description || data.msg || data.message || data.error || data.hint)) ||
                ('Máy chủ trả về lỗi ' + res.status);
      var err = new Error(msg);
      err.status = res.status;
      err.body = data;
      throw err;
    });
  }

  function signIn(email, password) {
    if (!isRemote()) return Promise.resolve(currentUser());
    return authFetch('token?grant_type=password', { email: email, password: password })
      .then(function (payload) { return saveSession(payload).user; });
  }

  function signOut() {
    var done = function () {
      session = null;
      drop(SESSION_KEY);
    };
    if (!isRemote() || !session) { done(); return Promise.resolve(); }
    return fetch(config.url + '/auth/v1/logout', {
      method: 'POST',
      headers: {
        apikey: config.key,
        Authorization: 'Bearer ' + session.access_token
      }
    }).catch(function () { /* mất mạng thì vẫn quên phiên ở máy này */ })
      .then(done);
  }

  // Vé hết hạn thì đổi vé mới. Nhiều lời gọi cùng lúc dùng chung một lần đổi.
  function freshToken() {
    if (!session) return Promise.reject(new Error('Chưa đăng nhập.'));
    if (Date.now() < session.expires_at) return Promise.resolve(session.access_token);
    if (refreshing) return refreshing;

    refreshing = authFetch('token?grant_type=refresh_token', { refresh_token: session.refresh_token })
      .then(function (payload) {
        refreshing = null;
        return saveSession(payload).access_token;
      })
      .catch(function (err) {
        refreshing = null;
        session = null;
        drop(SESSION_KEY);
        var e = new Error('Phiên đăng nhập đã hết hạn, mời đăng nhập lại.');
        e.status = 401;
        e.cause = err;
        throw e;
      });
    return refreshing;
  }

  /* ═══════════════════════════════════════════════════════════════
     Gọi PostgREST
     ═══════════════════════════════════════════════════════════════ */
  function rest(path, options) {
    options = options || {};
    return freshToken().then(function (token) {
      var headers = {
        apikey: config.key,
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json'
      };
      if (options.prefer) headers.Prefer = options.prefer;
      return fetch(config.url + '/rest/v1/' + path, {
        method: options.method || 'GET',
        headers: headers,
        body: options.body ? JSON.stringify(options.body) : undefined
      }).then(readJson);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     Chế độ "máy này"
     ═══════════════════════════════════════════════════════════════ */
  function localRows(table) { return read(LOCAL_PREFIX + table, []); }
  function localSave(table, rows) { return write(LOCAL_PREFIX + table, rows); }

  function localSort(rows, order) {
    if (!order) return rows;
    var parts = order.split('.');
    var field = parts[0];
    var dir = parts[1] === 'desc' ? -1 : 1;
    return rows.slice().sort(function (a, b) {
      var x = a[field], y = b[field];
      if (x === y) return 0;
      if (x === null || x === undefined) return 1;
      if (y === null || y === undefined) return -1;
      return (x > y ? 1 : -1) * dir;
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     Giao diện chung cho từng bảng
     ═══════════════════════════════════════════════════════════════ */
  function table(name) {
    if (TABLES.indexOf(name) === -1) throw new Error('Không có bảng "' + name + '".');

    return {
      list: function (opts) {
        opts = opts || {};
        if (!isRemote()) return Promise.resolve(localSort(localRows(name), opts.order));
        var q = 'select=*';
        if (opts.order) q += '&order=' + encodeURIComponent(opts.order);
        return rest(name + '?' + q);
      },

      insert: function (row) {
        if (!isRemote()) {
          var rows = localRows(name);
          var fresh = Object.assign({ id: uid(), created_at: new Date().toISOString() }, row);
          rows.push(fresh);
          if (!localSave(name, rows)) throw new Error('Không ghi được vào bộ nhớ trình duyệt.');
          return Promise.resolve(fresh);
        }
        return rest(name, { method: 'POST', body: row, prefer: 'return=representation' })
          .then(function (out) { return out && out[0]; });
      },

      update: function (id, patch) {
        if (!isRemote()) {
          var rows = localRows(name);
          var hit = null;
          rows.forEach(function (r) { if (r.id === id) { Object.assign(r, patch); hit = r; } });
          if (!hit) return Promise.reject(new Error('Không tìm thấy bản ghi để sửa.'));
          localSave(name, rows);
          return Promise.resolve(hit);
        }
        return rest(name + '?id=eq.' + encodeURIComponent(id),
                    { method: 'PATCH', body: patch, prefer: 'return=representation' })
          .then(function (out) { return out && out[0]; });
      },

      remove: function (id) {
        if (!isRemote()) {
          localSave(name, localRows(name).filter(function (r) { return r.id !== id; }));
          return Promise.resolve();
        }
        return rest(name + '?id=eq.' + encodeURIComponent(id), { method: 'DELETE' })
          .then(function () {});
      }
    };
  }

  /* ── Nội dung trang: một dòng duy nhất, key = 'site' ── */
  var content = {
    get: function () {
      if (!isRemote()) return Promise.resolve(read(LOCAL_PREFIX + 'content', null));
      return rest('site_content?key=eq.site&select=data').then(function (rows) {
        return rows && rows[0] ? rows[0].data : null;
      });
    },
    save: function (data) {
      if (!isRemote()) {
        if (!write(LOCAL_PREFIX + 'content', data)) {
          return Promise.reject(new Error('Không ghi được vào bộ nhớ trình duyệt.'));
        }
        return Promise.resolve(data);
      }
      // upsert: chèn, trùng khoá thì ghi đè
      return rest('site_content', {
        method: 'POST',
        body: { key: 'site', data: data, updated_at: new Date().toISOString() },
        prefer: 'resolution=merge-duplicates,return=representation'
      }).then(function () { return data; });
    }
  };

  /* ── Sao lưu: gom hết ra một file, và nạp ngược lại ── */
  function exportAll() {
    return Promise.all([
      table('cameras').list({ order: 'sort.asc' }),
      table('customers').list({ order: 'created_at.asc' }),
      table('bookings').list({ order: 'start_date.asc' }),
      content.get()
    ]).then(function (parts) {
      return {
        nem_shop_backup: 1,
        exported_at: new Date().toISOString(),
        mode: mode(),
        cameras: parts[0] || [],
        customers: parts[1] || [],
        bookings: parts[2] || [],
        content: parts[3] || null
      };
    });
  }

  // Nhập bản sao lưu: chèn từng dòng, giữ nguyên id để đơn thuê không mất
  // liên kết với khách và máy. Bản ghi trùng id thì cập nhật đè.
  function importAll(dump) {
    if (!dump || !dump.nem_shop_backup) {
      return Promise.reject(new Error('File này không phải bản sao lưu của NEM shop.'));
    }
    var order = ['cameras', 'customers', 'bookings'];
    var chain = Promise.resolve();
    var counts = { cameras: 0, customers: 0, bookings: 0 };

    order.forEach(function (name) {
      chain = chain.then(function () {
        var rows = dump[name] || [];
        if (!rows.length) return;
        counts[name] = rows.length;
        if (!isRemote()) return localSave(name, rows);
        return rest(name, {
          method: 'POST',
          body: rows,
          prefer: 'resolution=merge-duplicates,return=minimal'
        });
      });
    });

    return chain.then(function () {
      if (dump.content) return content.save(dump.content);
    }).then(function () { return counts; });
  }

  global.DB = {
    mode: mode,
    isRemote: isRemote,
    getConfig: function () { return config ? { url: config.url, key: config.key } : null; },
    setConfig: setConfig,
    clearConfig: clearConfig,

    signIn: signIn,
    signOut: signOut,
    currentUser: currentUser,
    hasSession: function () { return !isRemote() || !!session; },

    table: table,
    content: content,
    exportAll: exportAll,
    importAll: importAll,
    uid: uid
  };
})(window);
