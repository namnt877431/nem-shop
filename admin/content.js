/* ═══════════════════════════════════════════════════════════════
   NEM shop — nội dung trang giới thiệu

   Trang giới thiệu vẫn là trang tĩnh: mở thẳng bằng trình duyệt là
   chạy, không chờ mạng, không nhấp nháy. Nên chỗ này không bơm nội
   dung vào lúc người xem mở trang, mà đi đường khác:

       sửa trong trang quản trị → lưu vào Supabase → bấm "Xuất index.html"
       → nhận file mới → commit → GitHub Pages phục vụ file tĩnh như cũ.

   Bộ xuất đọc chính file index.html hiện có, thay chữ trong DOM rồi
   ghi ra lại. Không có bản sao thứ hai của khuôn trang nằm đây, nên
   sửa bố cục trang giới thiệu không làm trang quản trị lệch theo.
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var h = UI.h;

  /* ── Nội dung mặc định: chép đúng chữ đang có trên index.html ───
     Nhờ vậy lần xuất đầu tiên khi chưa sửa gì sẽ cho ra file y hệt
     bản gốc — có gì sai thì `git diff` nhìn ra ngay. ── */
  var DEFAULT = {
    meta: {
      title: 'NEM shop — Cho thuê Canon R50 & R8 theo ngày',
      description: 'Cho thuê Canon EOS R50 và R8 theo ngày. Chưa đủ tiền cọc vẫn thuê được: thẻ sinh viên, người bảo lãnh hoặc tài sản thay thế. Không giữ CCCD bản gốc.'
    },

    contact: {
      phone: '+84000000000',
      phoneText: '0… … …',
      navCta: 'Nhắn giữ máy',
      socialText: 'Facebook / Instagram',
      socialUrl: '#top'
    },

    delivery: {
      area: 'Khu vực: ……………………',
      hours: 'Hẹn giờ theo tin nhắn'
    },

    hero: {
      eyebrow: 'Canon R50 & R8 · thuê theo ngày',
      title: 'Cầm máy xịn\n**về cuối tuần**',
      sub: 'Máy đến tay bạn đã sạc đầy, thẻ đã format, ống kính lau sạch. Nhắn trước một hôm là có. Chưa đủ tiền cọc thì cứ nói, mình luôn tìm được cách.',
      ctaPrimary: 'Xem máy',
      ctaSecondary: 'Chuyện tiền cọc',
      facts: [
        { k: 'Lau kiểm', v: 'trước mỗi lượt giao' },
        { k: 'Nhắn là có', v: 'thường ngay trong ngày' },
        { k: 'Cọc linh hoạt', v: 'bàn theo từng người' }
      ],
      caption: 'EOS R50 · ốp da và dây đeo kèm theo máy',
      hud: {
        aperture: 'f/4.5–6.3',
        camera: 'Canon EOS R50',
        lens: 'RF-S 18–45mm',
        status: 'Sẵn máy'
      }
    },

    fleet: {
      title: 'Kho máy',
      sub: 'Máy nào cũng được lau và kiểm kỹ trước khi đến tay bạn.',
      footLeft: 'Vòng magenta = máy được thuê nhiều hơn',
      footRight: 'Máy nào cũng kèm pin, sạc, thẻ nhớ và dây đeo'
    },

    calc: {
      title: 'Tính thử\ntiền thuê',
      sub: 'Chọn máy, xoay vòng chọn số ngày. Thuê càng dài thì mỗi ngày càng nhẹ đi.',
      plateLeft: 'Tính giá thuê',
      plateRight: 'NEM shop · vnd',
      days: [1, 2, 3, 5, 7, 14, 30],
      tiers: [
        { days: 7, percent: 10 },
        { days: 14, percent: 15 },
        { days: 30, percent: 25 }
      ],
      note: 'Chưa gồm khoản đặt cọc — hoàn lại đủ khi bạn trả máy.',
      sideTitle: 'Con số này\nđã gồm những gì',
      sideSub: 'Không có phí ẩn. Những thứ dưới đây nằm sẵn trong giá, bạn không trả thêm.',
      includes: [
        { k: 'Ống kính kit', v: 'Có sẵn' },
        { k: 'Pin và sạc', v: 'Có sẵn' },
        { k: 'Thẻ nhớ đã format', v: 'Có sẵn' },
        { k: 'Ốp da và dây đeo', v: 'Có sẵn' },
        { k: 'Lau kiểm trước khi giao', v: 'Có sẵn' }
      ],
      sideCta: 'Còn tiền cọc thì sao'
    },

    steps: {
      title: 'Cách thuê',
      sub: 'Lần đầu mất khoảng mười lăm phút. Những lần sau chỉ còn nhắn tin và hẹn giờ.',
      items: [
        { label: 'Bước một', title: 'Nhắn tin\nchọn ngày', body: 'Nói bạn cần máy nào, từ hôm nào đến hôm nào. Tôi giữ máy chờ bạn.' },
        { label: 'Bước hai', title: 'Gặp nhau,\nxem máy', body: 'Bạn cầm thử, bấm thử. Hai bên ký giấy và quay một đoạn ngắn ghi lại tình trạng máy lúc đó.' },
        { label: 'Bước ba', title: 'Đi chụp\nthoải mái', body: 'Cần thêm ngày cứ nhắn. Máy trục trặc thì gọi tôi trước, đừng tự mở.' },
        { label: 'Bước bốn', title: 'Trả máy,\nlấy lại cọc', body: 'Máy nguyên vẹn, đúng hẹn thì tôi trả cọc ngay tại chỗ.' }
      ]
    },

    deposits: {
      title: 'Chuyện\ntiền cọc',
      sub: 'Cọc một thân máy là khoản lớn với sinh viên. Không có sẵn tiền cũng không sao — có mấy cách khác.',
      items: [
        { label: 'Cách 1', title: 'Cọc\nbằng tiền', body: 'Gọn nhất. Trả máy xong là nhận lại nguyên vẹn.' },
        { label: 'Cách 2', title: 'Gửi lại\nmột món đồ', body: 'Điện thoại, laptop, hay chiếc xe bạn không dùng tới trong mấy hôm đó.' },
        { label: 'Cách 3', title: 'Thẻ sinh viên\nlà đủ', body: 'Kèm số của một người tôi có thể gọi khi cần. Dành cho bạn nào đã thuê quen.' },
        { label: 'Cách 4', title: 'Nhờ người nhà\nđứng cùng', body: 'Một người thân cùng ký tên với bạn. Không cần cọc thêm gì.' }
      ],
      noteLabel: 'Nói trước cho rõ',
      noteBody: 'Không có cách nào là mặc định. Bạn nhắn cho tôi hoàn cảnh của mình, hai bên chọn cách nào mà cả hai đều thấy yên tâm rồi mới ghi vào giấy.'
    },

    trust: {
      title: 'Rõ ràng\ntừ đầu',
      sub: 'Bạn đang gửi đồ và thông tin cho một người quen qua mạng. Ba điều tôi muốn nói trước.',
      items: [
        { title: 'Tôi **không giữ**\ncăn cước của bạn', body: 'Chỉ xem tại chỗ để đối chiếu, rồi bạn cầm về ngay. Ảnh chụp giấy tờ tôi cất riêng và xóa khi không còn cần đến.' },
        { title: 'Đoạn video\nlà của cả hai', body: 'Lúc giao máy mình quay chung một đoạn ngắn. Sau này có thắc mắc về vết xước nào, cả hai cùng nhìn vào một chỗ.' },
        { title: 'Có hỏng thì\nxem giá trước', body: 'Tôi mang máy đi bảo hành lấy báo giá, gửi bạn xem cùng ảnh. Thống nhất rồi mới trừ vào cọc.' }
      ]
    },

    faq: {
      title: 'Hỏi đáp',
      sub: 'Còn thắc mắc gì khác, nhắn thẳng cho tôi.',
      items: [
        { q: 'Tôi là sinh viên, chưa có tiền cọc thì sao?', a: 'Vẫn thuê được. Phần lớn các bạn sinh viên chọn gửi lại điện thoại hoặc laptop, hoặc nhờ người nhà ký cùng. Bạn cứ nhắn cho tôi hoàn cảnh của mình, mình tìm cách hợp lý cho cả hai.' },
        { q: 'R50 hay R8 thì hợp với tôi hơn?', a: 'Đi chơi, quay vlog, chụp ban ngày thì R50 là đủ và nhẹ hơn nhiều. Chụp trong quán tối, chụp chân dung muốn xóa phông mạnh, hoặc quay 4K 60p thì lấy R8. Không chắc thì nhắn cho tôi biết bạn định chụp gì.' },
        { q: 'Cần chuẩn bị gì khi đi nhận máy?', a: 'Mang căn cước bản gốc để tôi đối chiếu tại chỗ, và món đồ đặt cọc nếu hai bên đã thống nhất. Mình gặp nhau khoảng mười lăm phút: bạn bấm thử máy, ký giấy, quay một đoạn ngắn rồi cầm máy đi.' },
        { q: 'Đang thuê mà cần thêm ngày thì sao?', a: 'Nhắn cho tôi trước giờ hẹn trả. Miễn chưa có ai đặt tiếp thì tôi gia hạn ngay, tính thêm theo ngày. Về trễ mà không báo trước mới bị tính phí.' },
        { q: 'Lỡ làm xước hoặc rơi máy thì tính sao?', a: 'Gọi cho tôi trước đã, và đừng tự mở máy hay tự lau cảm biến. Tôi mang đi bảo hành lấy báo giá rồi gửi bạn xem; thống nhất con số xong mới trừ vào cọc. Hao mòn thường khi dùng thì không tính.' },
        { q: 'Có cho thuê máy film hay ống kính rời không?', a: 'Hiện chưa. Bạn cần gì cứ nói, nhiều người hỏi thì tôi sẽ sắm thêm.' }
      ]
    },

    footer: {
      cta: 'Giữ máy cho cuối tuần này',
      ctaButton: 'Nhắn cho NEM shop',
      deliveryLabel: 'Giao nhận',
      contactLabel: 'Liên hệ',
      brandLine: 'NEM shop · cho thuê máy ảnh',
      priceLine: 'Giá cập nhật tháng 8, 2026'
    }
  };

  /* Gộp nội dung đã lưu lên trên mặc định, để thêm mục mới vào
     DEFAULT không làm hỏng dữ liệu cũ của shop. */
  function merge(base, patch) {
    if (patch === null || patch === undefined) return clone(base);
    if (Array.isArray(base) || Array.isArray(patch)) return clone(patch);
    if (typeof base !== 'object' || typeof patch !== 'object') return patch;
    var out = {};
    Object.keys(base).forEach(function (k) { out[k] = merge(base[k], patch[k]); });
    Object.keys(patch).forEach(function (k) { if (!(k in out)) out[k] = clone(patch[k]); });
    return out;
  }
  function clone(v) { return v === undefined ? v : JSON.parse(JSON.stringify(v)); }

  function withDefaults(saved) { return merge(DEFAULT, saved); }

  /* ═══════════════════════════════════════════════════════════════
     Ghi chữ vào DOM

     setLines  — mỗi dòng xuống hàng thành <br>
     setRich   — như trên, thêm **chữ nhấn** thành thẻ nhấn của mục đó
     Cả hai đều đi qua createTextNode, không nối chuỗi HTML.
     ═══════════════════════════════════════════════════════════════ */
  function setLines(doc, el, text) { setRich(doc, el, text, null); }

  function setRich(doc, el, text, strongTag) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
    String(text === null || text === undefined ? '' : text).split('\n').forEach(function (line, i) {
      if (i) el.appendChild(doc.createElement('br'));
      if (!strongTag) { el.appendChild(doc.createTextNode(line)); return; }
      line.split('**').forEach(function (part, j) {
        if (!part) return;
        if (j % 2) {
          var strong = doc.createElement(strongTag);
          strong.textContent = part;
          el.appendChild(strong);
        } else {
          el.appendChild(doc.createTextNode(part));
        }
      });
    });
  }

  function setText(el, text) { if (el) el.textContent = text === null || text === undefined ? '' : text; }
  function setAttr(el, name, value) { if (el) el.setAttribute(name, value); }

  function sectionHead(doc, root, sel, title, sub, strongTag) {
    var sec = root.querySelector(sel);
    if (!sec) return;
    setRich(doc, sec.querySelector('.sec-head h2'), title, strongTag || null);
    setText(sec.querySelector('.sec-head p'), sub);
  }

  /* Thay toàn bộ con của một khối bằng danh sách mới dựng từ dữ liệu.

     Giữ lại nếp thụt đầu dòng của khối gốc. Nếu không giữ, cả mục sẽ bị
     ép thành một dòng dài: file vẫn chạy, nhưng `git diff` không còn đọc
     được và index.html hết sửa tay được — mà đó lại là hai thứ repo này
     dựa vào. Khối nào vốn viết liền một dòng thì để nguyên liền. */
  function refill(container, items, build) {
    if (!container) return;

    var doc = container.ownerDocument;
    var inner = indentBefore(container.firstChild);
    var outer = indentBefore(container.lastChild);

    while (container.firstChild) container.removeChild(container.firstChild);

    items.forEach(function (item, i) {
      if (inner !== null) container.appendChild(doc.createTextNode('\n' + inner));
      container.appendChild(build(item, i, inner));
    });
    if (outer !== null && items.length) container.appendChild(doc.createTextNode('\n' + outer));
  }

  // Đoạn thụt đầu dòng nằm cuối một nút văn bản khoảng trắng, nếu có.
  function indentBefore(node) {
    if (!node || node.nodeType !== 3) return null;
    var m = /\n([ \t]*)$/.exec(node.nodeValue);
    return m ? m[1] : null;
  }

  // Xếp các con trên từng dòng riêng, thụt vào một nấc so với thẻ mẹ.
  function nest(doc, parent, indent, children) {
    children = children.filter(Boolean);
    if (indent === null || indent === undefined) {
      children.forEach(function (child) { parent.appendChild(child); });
      return parent;
    }
    children.forEach(function (child) {
      parent.appendChild(doc.createTextNode('\n' + indent));
      parent.appendChild(child);
    });
    if (children.length) parent.appendChild(doc.createTextNode('\n' + indent.slice(2)));
    return parent;
  }

  /* ── Đoạn cấu hình giá nằm trong <script> của index.html ────── */
  function calcBlock(calc) {
    var days = (calc.days || []).slice().sort(function (a, b) { return a - b; });
    var tiers = (calc.tiers || []).slice()
      .filter(function (t) { return t.days > 0 && t.percent > 0; })
      .sort(function (a, b) { return b.days - a.days; });   // mốc cao xét trước

    var lines = [];
    lines.push('  var DAYS = [' + days.join(',') + '];');
    lines.push('  function discount(d){');
    tiers.forEach(function (t) {
      lines.push('    if (d >= ' + t.days + ') return ' + (t.percent / 100) + ';');
    });
    lines.push('    return 0;');
    lines.push('  }');
    return lines.join('\n');
  }

  var CALC_RE = /(\/\* nem:calc:start \*\/)[\s\S]*?(\/\* nem:calc:end \*\/)/;

  /* ═══════════════════════════════════════════════════════════════
     Dựng file index.html mới
     ═══════════════════════════════════════════════════════════════ */
  function render(sourceHtml, content, cameras) {
    var c = withDefaults(content);
    var doc = new DOMParser().parseFromString(sourceHtml, 'text/html');
    if (!doc || !doc.querySelector('.hero')) {
      throw new Error('Không đọc được index.html — có đúng là file gốc của trang không?');
    }

    var live = (cameras || []).filter(function (cam) { return cam.active !== false; })
      .sort(function (a, b) { return (a.sort || 0) - (b.sort || 0); });

    /* ── Thẻ đầu trang ── */
    setText(doc.querySelector('title'), c.meta.title);
    setAttr(doc.querySelector('meta[name="description"]'), 'content', c.meta.description);

    /* ── Thanh điều hướng ── */
    var navCall = doc.querySelector('.topnav .call');
    setText(navCall, c.contact.navCta);
    setAttr(navCall, 'href', 'tel:' + c.contact.phone);

    /* ── Hero ── */
    setText(doc.querySelector('.hero .eyebrow'), c.hero.eyebrow);
    setRich(doc, doc.querySelector('.hero h1'), c.hero.title, 'em');
    setText(doc.querySelector('.hero-sub'), c.hero.sub);

    var heroBtns = doc.querySelectorAll('.hero-cta .btn');
    setText(heroBtns[0], c.hero.ctaPrimary);
    setText(heroBtns[1], c.hero.ctaSecondary);

    refill(doc.querySelector('.hero-facts'), c.hero.facts, function (f) {
      var div = doc.createElement('div');
      var b = doc.createElement('b'); b.textContent = f.k;
      var s = doc.createElement('span'); s.className = 'mono'; s.textContent = f.v;
      div.appendChild(b); div.appendChild(s);
      return div;
    });

    setText(doc.querySelector('.shot figcaption'), c.hero.caption);

    var hud = doc.querySelectorAll('.hud-in > span');
    if (hud.length >= 5) {
      setText(hud[1], c.hero.hud.aperture);
      // "Canon <b>EOS R50</b>" — chữ đậm là phần sau khoảng trắng đầu tiên
      var camName = String(c.hero.hud.camera || '');
      var cut = camName.indexOf(' ');
      while (hud[2].firstChild) hud[2].removeChild(hud[2].firstChild);
      if (cut === -1) {
        hud[2].textContent = camName;
      } else {
        hud[2].appendChild(doc.createTextNode(camName.slice(0, cut + 1)));
        var strong = doc.createElement('b');
        strong.textContent = camName.slice(cut + 1);
        hud[2].appendChild(strong);
      }
      setText(hud[3], c.hero.hud.lens);
      setText(hud[4], c.hero.hud.status);
    }

    /* ── Kho máy ── */
    sectionHead(doc, doc, '#may', c.fleet.title, c.fleet.sub);

    refill(doc.querySelector('.fleet'), live, function (cam, i, ind) {
      var art = doc.createElement('article');
      art.className = 'frame' + (cam.featured ? ' picked' : '');

      var no = doc.createElement('span');
      no.className = 'frame-no';
      no.textContent = cam.code || '';

      // Tên máy xuống dòng sau từ đầu tiên: "Canon" / "EOS R50"
      var head = doc.createElement('h3');
      var name = String(cam.name || '');
      var sp = name.indexOf(' ');
      setLines(doc, head, sp === -1 ? name : name.slice(0, sp) + '\n' + name.slice(sp + 1));

      var who = doc.createElement('p');
      who.className = 'who';
      who.textContent = cam.who || '';

      var ul = doc.createElement('ul');
      ul.className = 'spec';
      nest(doc, ul, ind === null ? null : ind + '    ', (cam.specs || []).map(function (s) {
        var li = doc.createElement('li');
        li.appendChild(doc.createTextNode(s.k));
        var b = doc.createElement('b');
        b.textContent = s.v;
        li.appendChild(b);
        return li;
      }));

      var rate = doc.createElement('div');
      rate.className = 'rate';
      rate.appendChild(doc.createTextNode(UI.vnd(cam.day_rate)));
      var small = doc.createElement('small');
      small.textContent = 'đ / ngày';
      rate.appendChild(small);

      return nest(doc, art, ind === null ? null : ind + '  ', [no, head, who, ul, rate]);
    });

    var foot = doc.querySelectorAll('.fleet-foot .mono');
    setText(foot[0], c.fleet.footLeft);
    setText(foot[1], c.fleet.footRight);

    /* ── Tính giá ── */
    sectionHead(doc, doc, '#tinh-gia', c.calc.title, c.calc.sub);

    var plate = doc.querySelectorAll('.plate-head .mono');
    setText(plate[0], c.calc.plateLeft);
    setText(plate[1], c.calc.plateRight);

    refill(doc.querySelector('.classes'), live, function (cam, i) {
      var b = doc.createElement('button');
      b.className = 'class-btn';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', i === 0 ? 'true' : 'false');
      b.setAttribute('data-rate', String(cam.day_rate || 0));
      b.setAttribute('data-name', cam.short || cam.name || '');
      b.appendChild(doc.createTextNode(cam.short || cam.name || ''));
      var span = doc.createElement('span');
      span.textContent = cam.badge || '';
      b.appendChild(span);
      return b;
    });

    setText(doc.querySelector('.counter .note'), c.calc.note);
    setRich(doc, doc.querySelector('.calc-side h3'), c.calc.sideTitle, null);
    setText(doc.querySelector('.calc-side p'), c.calc.sideSub);

    refill(doc.querySelector('.calc-list'), c.calc.includes, function (item) {
      var li = doc.createElement('li');
      li.appendChild(doc.createTextNode(item.k));
      var b = doc.createElement('b');
      b.textContent = item.v;
      li.appendChild(b);
      return li;
    });
    setText(doc.querySelector('.calc-side .btn'), c.calc.sideCta);

    /* ── Cách thuê ── */
    sectionHead(doc, doc, '#cach-thue', c.steps.title, c.steps.sub);
    refill(doc.querySelector('.steps'), c.steps.items, function (s, i, ind) {
      return labelledCard(doc, 'step', s.label, s.title, s.body, ind);
    });

    /* ── Tiền cọc ── */
    sectionHead(doc, doc, '#dat-coc', c.deposits.title, c.deposits.sub);
    refill(doc.querySelector('.holds'), c.deposits.items, function (s, i, ind) {
      return labelledCard(doc, 'hold', s.label, s.title, s.body, ind);
    });
    setText(doc.querySelector('.hold-note .mono'), c.deposits.noteLabel);
    setText(doc.querySelector('.hold-note p'), c.deposits.noteBody);

    /* ── Minh bạch ── */
    sectionHead(doc, doc, '#minh-bach', c.trust.title, c.trust.sub);
    refill(doc.querySelector('.trust'), c.trust.items, function (t, i, ind) {
      var cell = doc.createElement('div');
      cell.className = 'tcell';
      var head = doc.createElement('h3');
      setRich(doc, head, t.title, 'b');
      var p = doc.createElement('p');
      p.textContent = t.body;
      return nest(doc, cell, ind === null ? null : ind + '  ', [head, p]);
    });

    /* ── Hỏi đáp ── */
    sectionHead(doc, doc, '#hoi', c.faq.title, c.faq.sub);
    refill(doc.querySelector('.faq'), c.faq.items, function (item, i, ind) {
      var d = doc.createElement('details');
      if (i === 0) d.setAttribute('open', '');
      var s = doc.createElement('summary');
      s.textContent = item.q;
      var p = doc.createElement('p');
      p.textContent = item.a;
      return nest(doc, d, ind === null ? null : ind + '  ', [s, p]);
    });

    /* ── Chân trang ── */
    setRich(doc, doc.querySelector('.foot h2'), c.footer.cta, null);

    var footCta = doc.querySelector('.foot-grid .btn');
    setText(footCta, c.footer.ctaButton);
    setAttr(footCta, 'href', 'tel:' + c.contact.phone);

    var cols = doc.querySelectorAll('.foot-col');
    if (cols.length >= 2) {
      setText(cols[0].querySelector('.mono'), c.footer.deliveryLabel);
      var dp = cols[0].querySelectorAll('p');
      setText(dp[0], c.delivery.area);
      setText(dp[1], c.delivery.hours);

      setText(cols[1].querySelector('.mono'), c.footer.contactLabel);
      var links = cols[1].querySelectorAll('p a');
      setText(links[0], c.contact.phoneText);
      setAttr(links[0], 'href', 'tel:' + c.contact.phone);
      setText(links[1], c.contact.socialText);
      setAttr(links[1], 'href', c.contact.socialUrl || '#top');
    }

    var end = doc.querySelectorAll('.foot-end .mono');
    setText(end[0], c.footer.brandLine);
    setText(end[1], c.footer.priceLine);

    /* ── Dọn các ghi chú TODO đã được điền ── */
    stripTodos(doc);

    /* ── Ghép lại thành chuỗi, rồi vá đoạn cấu hình giá trong script ── */
    var out = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML + '\n';

    if (!CALC_RE.test(out)) {
      throw new Error('Không thấy mốc /* nem:calc:start */ trong index.html — file gốc đã bị sửa?');
    }
    out = out.replace(CALC_RE, function (_, open, close) {
      return open + '\n' + calcBlock(c.calc) + '\n  ' + close;
    });

    // DOMParser trả về LF. File gốc dùng CRLF thì trả lại CRLF, để bản tải
    // về thay thẳng được file cũ mà không làm cả trang thành một khối diff.
    if (/\r\n/.test(sourceHtml)) out = out.replace(/\r?\n/g, '\r\n');

    return out;
  }

  function labelledCard(doc, cls, label, title, body, ind) {
    var div = doc.createElement('div');
    div.className = cls;
    var m = doc.createElement('span');
    m.className = 'mono';
    m.textContent = label;
    var head = doc.createElement('h3');
    setLines(doc, head, title);
    var p = doc.createElement('p');
    p.textContent = body;
    return nest(doc, div, ind === null || ind === undefined ? null : ind + '  ', [m, head, p]);
  }

  // Bỏ các ghi chú TODO, kèm luôn dòng trống mà chúng để lại.
  function stripTodos(doc) {
    var walker = doc.createTreeWalker(doc.documentElement, NodeFilter.SHOW_COMMENT);
    var doomed = [];
    var node;
    while ((node = walker.nextNode())) {
      if (/TODO/.test(node.nodeValue)) doomed.push(node);
    }
    doomed.forEach(function (n) {
      var before = n.previousSibling;
      if (n.parentNode) n.parentNode.removeChild(n);
      if (before && before.nodeType === 3 && /^\s*$/.test(before.nodeValue) && before.parentNode) {
        before.parentNode.removeChild(before);
      }
    });
  }

  /* ── Kiểm tra trước khi xuất: nhắc những chỗ còn bỏ ngỏ ── */
  function warnings(content, cameras) {
    var c = withDefaults(content);
    var list = [];

    if (!c.contact.phone || /^\+?840{6,}$/.test(c.contact.phone.replace(/\s/g, ''))) {
      list.push('Số điện thoại vẫn là số giữ chỗ +84000000000.');
    }
    if (/…/.test(c.contact.phoneText)) list.push('Số hiển thị ở chân trang vẫn là dấu chấm lửng.');
    if (/…/.test(c.delivery.area)) list.push('Khu vực giao nhận chưa điền.');
    if (!c.contact.socialUrl || c.contact.socialUrl === '#top') {
      list.push('Liên kết Facebook / Instagram chưa trỏ đi đâu.');
    }

    var live = (cameras || []).filter(function (cam) { return cam.active !== false; });
    if (!live.length) list.push('Không có máy nào đang bật — trang sẽ hiện kho máy trống.');
    live.forEach(function (cam) {
      if (!cam.day_rate) list.push('Máy "' + cam.name + '" chưa có đơn giá theo ngày.');
    });

    return list;
  }

  global.Content = {
    DEFAULT: DEFAULT,
    withDefaults: withDefaults,
    render: render,
    warnings: warnings,
    clone: clone
  };
})(window);
