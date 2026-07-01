/* =========================================================
   STATE
   ========================================================= */

let a = 1, b = 0, c = 0;
let chart = null;

const el = (id) => document.getElementById(id);

/* =========================================================
   PLUGIN: garis sumbu X & Y yang tegas pada grafik
   ========================================================= */

const pluginSumbu = {
  id: 'pluginSumbu',
  afterDraw(chartInstance){
    const { ctx, scales } = chartInstance;
    const xZero = scales.x.getPixelForValue(0);
    const yZero = scales.y.getPixelForValue(0);
    const { left, right, top, bottom } = chartInstance.chartArea;

    ctx.save();
    ctx.strokeStyle = 'rgba(30,42,71,0.55)';
    ctx.lineWidth = 1.5;

    if (xZero >= left && xZero <= right) {
      ctx.beginPath();
      ctx.moveTo(xZero, top);
      ctx.lineTo(xZero, bottom);
      ctx.stroke();
    }
    if (yZero >= top && yZero <= bottom) {
      ctx.beginPath();
      ctx.moveTo(left, yZero);
      ctx.lineTo(right, yZero);
      ctx.stroke();
    }
    ctx.restore();
  }
};
Chart.register(pluginSumbu);

/* =========================================================
   PARSING FUNGSI YANG DIKETIK MANUAL
   ========================================================= */

function parseFungsi(teks){

  let fungsi = teks
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/^y=/, '')
    .replace(/²/g, '^2')
    .replace(/−/g, '-');

  let suku = fungsi.match(/[+-]?[^+-]+/g);
  if(!suku) return null;

  let pa = 0, pb = 0, pc = 0;
  let adaSuku = false;

  for(const term of suku){

    if(/x(\^2)/.test(term)){
      let koef = term.replace(/x(\^2)/, '').trim();
      if(koef === '' || koef === '+') pa += 1;
      else if(koef === '-') pa += -1;
      else { let n = parseFloat(koef); pa += isNaN(n) ? 1 : n; }
      adaSuku = true;
    }
    else if(term.includes('x')){
      let koef = term.replace('x', '').trim();
      if(koef === '' || koef === '+') pb += 1;
      else if(koef === '-') pb += -1;
      else { let n = parseFloat(koef); pb += isNaN(n) ? 1 : n; }
      adaSuku = true;
    }
    else{
      let n = parseFloat(term);
      if(!isNaN(n)){ pc += n; adaSuku = true; }
    }
  }

  if(!adaSuku || isNaN(pa) || isNaN(pb) || isNaN(pc)) return null;

  return { a: pa, b: pb, c: pc };
}

/* =========================================================
   ANALISIS MATEMATIS
   ========================================================= */

function hitungAnalisis(a, b, c){

  if(a === 0){
    // bukan kuadrat lagi — fungsi linear
    let akarX = (b !== 0) ? (-c / b) : null;
    return {
      linear: true,
      gradien: b,
      titikY: c,
      akarX
    };
  }

  const xs = -b / (2*a);
  const yp = a*xs*xs + b*xs + c;
  const D = b*b - 4*a*c;

  let akar = [];
  if(D > 0){
    akar = [ (-b + Math.sqrt(D)) / (2*a), (-b - Math.sqrt(D)) / (2*a) ];
  } else if(D === 0){
    akar = [ -b / (2*a) ];
  }

  return {
    linear: false,
    a, b, c,
    xs, yp, D,
    akar,
    cekungAtas: a > 0,
    titikY: c
  };
}

/* =========================================================
   RENDER PANEL ANALISIS
   ========================================================= */

function baris(label, value, kelasAccent){
  return `<div class="data-row">
    <span class="data-label">${label}</span>
    <span class="data-value${kelasAccent ? ' ' + kelasAccent : ''}">${value}</span>
  </div>`;
}

function judulGrup(teks){
  return `<p class="group-title">${teks}</p>`;
}

function tampilkanAnalisis(hasil){

  const target = el('hasilAnalisis');

  if(hasil.linear){
    let html = `<div class="note-banner">⚠️ a = 0 → ini bukan fungsi kuadrat, melainkan fungsi <b>linear</b>: y = ${fmt(hasil.gradien)}x + ${fmt(hasil.titikY)}</div>`;
    html += judulGrup('Sifat Garis');
    html += baris('Gradien (m)', fmt(hasil.gradien));
    html += baris('Titik potong Y', `(0, ${fmt(hasil.titikY)})`, 'accent-y');
    html += baris('Titik potong X', hasil.akarX !== null ? `(${fmt(hasil.akarX)}, 0)` : 'Tidak ada (garis mendatar)', 'accent-root');
    target.innerHTML = html;
    return;
  }

  const { a, b, c, xs, yp, D, akar, cekungAtas, titikY } = hasil;

  let html = '';

  html += judulGrup('Bentuk &amp; Sifat');
  html += baris('Koefisien', `a=${fmt(a)}, b=${fmt(b)}, c=${fmt(c)}`);
  html += baris('Kecekungan', cekungAtas ? 'Terbuka ke atas ⌣ (a > 0)' : 'Terbuka ke bawah ⌢ (a < 0)', 'accent-curve');
  html += baris(cekungAtas ? 'Nilai minimum' : 'Nilai maksimum', fmt(yp), 'accent-vertex');

  html += judulGrup('Titik-titik Penting');
  html += baris('Sumbu simetri', `x = ${fmt(xs)}`);
  html += baris('Titik puncak', `(${fmt(xs)}, ${fmt(yp)})`, 'accent-vertex');
  html += baris('Diskriminan (D)', `${fmt(D)} ${D > 0 ? '(D > 0)' : D === 0 ? '(D = 0)' : '(D < 0)'}`);

  if(D > 0){
    html += baris('Titik potong X', `(${fmt(akar[0])}, 0) dan (${fmt(akar[1])}, 0)`, 'accent-root');
  } else if(D === 0){
    html += baris('Titik potong X', `Menyinggung di (${fmt(akar[0])}, 0)`, 'accent-root');
  } else {
    html += baris('Titik potong X', 'Tidak ada (D < 0)', 'accent-root');
  }

  html += baris('Titik potong Y', `(0, ${fmt(titikY)})`, 'accent-y');

  html += judulGrup('Domain &amp; Perilaku');
  html += baris('Domain', 'Semua bilangan real (-∞, ∞)');
  html += baris('Range', cekungAtas ? `[${fmt(yp)}, ∞)` : `(-∞, ${fmt(yp)}]`);

  if(cekungAtas){
    html += baris('Interval turun', `x < ${fmt(xs)}`);
    html += baris('Interval naik', `x > ${fmt(xs)}`);
  } else {
    html += baris('Interval naik', `x < ${fmt(xs)}`);
    html += baris('Interval turun', `x > ${fmt(xs)}`);
  }

  target.innerHTML = html;
}

function fmt(n){
  if(Object.is(n, -0)) n = 0;
  return Number.isInteger(n) ? n.toString() : n.toFixed(2);
}

/* =========================================================
   CARA PENGERJAAN
   Satu sumber data dipakai untuk render HTML (panel) dan
   teks polos (tombol salin), supaya rumus tidak pernah
   bisa berbeda antara dua tampilan.
   ========================================================= */

function K(teks){ return { tipe: 'ket', teks }; }
function L(teks){ return { tipe: 'baris', teks }; }

function dataLangkah(hasil){

  if(hasil.linear){
    const { gradien, titikY, akarX } = hasil;
    const item = [
      K('Karena a = 0, fungsi ini berbentuk linear y = bx + c, bukan kuadrat lagi.'),
      L(`Gradien (kemiringan): m = b = ${fmt(gradien)}`),
      L(`Titik potong sumbu Y (x = 0): y = ${fmt(titikY)}`)
    ];
    if(akarX !== null){
      item.push(
        K('Titik potong sumbu X dicari dengan menyamakan y = 0:'),
        L(`0 = (${fmt(gradien)})x + ${fmt(titikY)}`),
        L(`x = -(${fmt(titikY)}) / (${fmt(gradien)}) = ${fmt(akarX)}`)
      );
    } else {
      item.push(K('Karena b = 0, garis ini mendatar dan tidak memotong sumbu X.'));
    }
    return [{ judul: 'Penyelesaian Fungsi Linear', item }];
  }

  const { a, b, c, xs, yp, D, akar, cekungAtas } = hasil;

  const blok1 = {
    judul: '1. Sumbu Simetri & Titik Puncak',
    item: [
      K('Sumbu simetri dicari dengan rumus x = -b / (2a):'),
      L(`x = -(${fmt(b)}) / (2 × ${fmt(a)})`),
      L(`x = ${fmt(-b)} / ${fmt(2*a)}`),
      L(`x = ${fmt(xs)}`),
      K(`Nilai y di titik puncak dicari dengan substitusi x = ${fmt(xs)} ke fungsi:`),
      L(`y = (${fmt(a)})(${fmt(xs)})² + (${fmt(b)})(${fmt(xs)}) + (${fmt(c)})`),
      L(`y = ${fmt(a*xs*xs)} + ${fmt(b*xs)} + ${fmt(c)}`),
      L(`y = ${fmt(yp)}`),
      K(`Jadi titik puncak: (${fmt(xs)}, ${fmt(yp)})`)
    ]
  };

  const blok2Item = [
    K('Diskriminan dicari dengan rumus D = b² - 4ac:'),
    L(`D = (${fmt(b)})² - 4(${fmt(a)})(${fmt(c)})`),
    L(`D = ${fmt(b*b)} - ${fmt(4*a*c)}`),
    L(`D = ${fmt(D)}`)
  ];

  if(D > 0){
    blok2Item.push(
      K('Karena D > 0, ada dua titik potong sumbu X. Gunakan rumus kuadrat x = (-b ± √D) / (2a):'),
      L(`x₁ = (-(${fmt(b)}) + √${fmt(D)}) / (2 × ${fmt(a)}) = ${fmt(akar[0])}`),
      L(`x₂ = (-(${fmt(b)}) - √${fmt(D)}) / (2 × ${fmt(a)}) = ${fmt(akar[1])}`)
    );
  } else if(D === 0){
    blok2Item.push(
      K('Karena D = 0, grafik hanya menyinggung sumbu X di satu titik:'),
      L(`x = -(${fmt(b)}) / (2 × ${fmt(a)}) = ${fmt(akar[0])}`)
    );
  } else {
    blok2Item.push(K('Karena D < 0, akar tidak real sehingga grafik tidak memotong sumbu X sama sekali.'));
  }

  const blok2 = { judul: '2. Diskriminan & Titik Potong Sumbu X', item: blok2Item };

  const blok3 = {
    judul: '3. Titik Potong Sumbu Y',
    item: [
      K('Titik potong sumbu Y dicari dengan substitusi x = 0 ke fungsi:'),
      L(`y = (${fmt(a)})(0)² + (${fmt(b)})(0) + ${fmt(c)}`),
      L(`y = ${fmt(c)}`),
      K(`Jadi titik potong sumbu Y: (0, ${fmt(c)})`)
    ]
  };

  const blok4 = {
    judul: '4. Range & Interval Naik/Turun',
    item: [
      K(`Karena a ${a>0 ? '> 0 (positif)' : '< 0 (negatif)'}, parabola terbuka ke ${cekungAtas ? 'atas' : 'bawah'}.`),
      K(`Artinya titik puncak adalah nilai ${cekungAtas ? 'minimum' : 'maksimum'} dari fungsi, yaitu y = ${fmt(yp)}.`),
      L(`Range: ${cekungAtas ? `[${fmt(yp)}, ∞)` : `(-∞, ${fmt(yp)}]`}`),
      L(cekungAtas
        ? `Fungsi turun saat x < ${fmt(xs)}, lalu naik saat x > ${fmt(xs)}`
        : `Fungsi naik saat x < ${fmt(xs)}, lalu turun saat x > ${fmt(xs)}`)
    ]
  };

  return [blok1, blok2, blok3, blok4];
}

function renderLangkahHtml(blokList){
  return blokList.map(blok => {
    const body = blok.item.map(it =>
      it.tipe === 'ket'
        ? `<p class="langkah-keterangan">${it.teks}</p>`
        : `<span class="langkah-line">${it.teks}</span>`
    ).join('');
    return `<details class="langkah-group"><summary>${blok.judul}</summary><div class="langkah-body">${body}</div></details>`;
  }).join('');
}

function tampilkanLangkah(hasil){
  const container = el('langkahPengerjaan');
  const blokList = dataLangkah(hasil);

  const sebelumnya = Array.from(container.querySelectorAll('details')).map(d => d.open);
  container.innerHTML = renderLangkahHtml(blokList);

  const baru = container.querySelectorAll('details');
  baru.forEach((d, i) => {
    d.open = (sebelumnya.length === baru.length) ? sebelumnya[i] : true;
  });
}

function renderLangkahTeks(blokList){
  return blokList.map(blok =>
    blok.judul.toUpperCase() + '\n' + blok.item.map(it => '- ' + it.teks).join('\n')
  ).join('\n\n');
}

function buatLabelFungsi(a, b, c){
  let s = 'y = ' + fmt(a) + 'x²';
  s += (b >= 0 ? ' + ' : ' - ') + fmt(Math.abs(b)) + 'x';
  s += (c >= 0 ? ' + ' : ' - ') + fmt(Math.abs(c));
  return s;
}

/* =========================================================
   GRAFIK
   ========================================================= */

function gambarGrafik(hasil){

  if(chart) chart.destroy();

  let titikAcuan;
  let a_, b_, c_;

  if(hasil.linear){
    a_ = 0; b_ = hasil.gradien; c_ = hasil.titikY;
    titikAcuan = [0, hasil.akarX !== null ? hasil.akarX : 0];
  } else {
    a_ = hasil.a; b_ = hasil.b; c_ = hasil.c;
    titikAcuan = [hasil.xs, 0, ...hasil.akar];
  }

  let xMin = Math.min(...titikAcuan);
  let xMax = Math.max(...titikAcuan);
  let span = Math.max(xMax - xMin, 4);
  let padding = span * 0.45 + 1;
  xMin -= padding;
  xMax += padding;

  const jumlahTitik = 240;
  const langkah = (xMax - xMin) / jumlahTitik;
  const dataKurva = [];
  for(let i = 0; i <= jumlahTitik; i++){
    const x = xMin + i * langkah;
    const y = a_*x*x + b_*x + c_;
    dataKurva.push({ x, y });
  }

  const datasets = [
    {
      type: 'line',
      label: 'Kurva',
      data: dataKurva,
      borderColor: '#FF6B4A',
      borderWidth: 3,
      pointRadius: 0,
      tension: 0,
      fill: false
    }
  ];

  if(!hasil.linear){
    datasets.push({
      type: 'scatter',
      label: 'Titik puncak',
      data: [{ x: hasil.xs, y: hasil.yp }],
      backgroundColor: '#F2B134',
      pointRadius: 6,
      pointHoverRadius: 7
    });

    if(hasil.akar.length){
      datasets.push({
        type: 'scatter',
        label: 'Titik potong X',
        data: hasil.akar.map(x => ({ x, y: 0 })),
        backgroundColor: '#1FAFA0',
        pointRadius: 6,
        pointHoverRadius: 7
      });
    }

    datasets.push({
      type: 'scatter',
      label: 'Titik potong Y',
      data: [{ x: 0, y: hasil.titikY }],
      backgroundColor: '#6C5CE7',
      pointRadius: 6,
      pointHoverRadius: 7
    });
  } else {
    datasets.push({
      type: 'scatter',
      label: 'Titik potong Y',
      data: [{ x: 0, y: hasil.titikY }],
      backgroundColor: '#6C5CE7',
      pointRadius: 6
    });
    if(hasil.akarX !== null){
      datasets.push({
        type: 'scatter',
        label: 'Titik potong X',
        data: [{ x: hasil.akarX, y: 0 }],
        backgroundColor: '#1FAFA0',
        pointRadius: 6
      });
    }
  }

  chart = new Chart(el('grafikEksplorasi'), {
    data: { datasets },
    options: {
      animation: { duration: 250 },
      plugins: { legend: { display: false } },
      scales: {
        x: {
          type: 'linear',
          min: xMin,
          max: xMax,
          title: { display: true, text: 'x' },
          grid: { color: 'rgba(30,42,71,0.06)' }
        },
        y: {
          title: { display: true, text: 'y' },
          grid: { color: 'rgba(30,42,71,0.06)' },
          ticks: { callback: (v) => fmt(v) }
        }
      }
    }
  });
}

/* =========================================================
   UNDUH GRAFIK SEBAGAI GAMBAR
   ========================================================= */

function unduhGrafik(){
  if(!chart) return;
  const url = chart.toBase64Image('image/png', 1);
  const a_ = document.createElement('a');
  a_.href = url;
  a_.download = `grafik-${buatLabelFungsi(a, b, c).replace(/[\s=²]/g, '')}.png`;
  document.body.appendChild(a_);
  a_.click();
  document.body.removeChild(a_);
  tampilkanNudge('Grafik diunduh ✅');
}

/* =========================================================
   SINKRONISASI INPUT (slider <-> angka <-> persamaan)
   ========================================================= */

function ambilNilai(){
  return {
    a: parseFloat(el('numA').value),
    b: parseFloat(el('numB').value),
    c: parseFloat(el('numC').value)
  };
}

function setNilai(na, nb, nc){
  a = na; b = nb; c = nc;

  el('numA').value = fmt(a);
  el('numB').value = fmt(b);
  el('numC').value = fmt(c);
  el('sliderA').value = clamp(a, -10, 10);
  el('sliderB').value = clamp(b, -10, 10);
  el('sliderC').value = clamp(c, -10, 10);

  perbaruiTampilan();
}

function clamp(n, min, max){
  return Math.max(min, Math.min(max, n));
}

function perbaruiTampilan(){
  const hasil = hitungAnalisis(a, b, c);
  tampilkanAnalisis(hasil);
  gambarGrafik(hasil);
  tampilkanLangkah(hasil);
}

function tampilkanNudge(teks){
  const p = el('pesanNudge');
  p.textContent = teks;
  p.classList.remove('hidden');
  clearTimeout(window._nudgeTimeout);
  window._nudgeTimeout = setTimeout(() => p.classList.add('hidden'), 2500);
}

/* a tidak boleh persis 0 pada fungsi kuadrat */
function jagaA(nilaiBaru, arahDariPositif){
  if(nilaiBaru === 0){
    tampilkanNudge('a tidak boleh 0 pada fungsi kuadrat, otomatis diset ke 0.1');
    return arahDariPositif ? 0.1 : -0.1;
  }
  return nilaiBaru;
}

/* =========================================================
   RIWAYAT EKSPLORASI (disimpan lokal di perangkat ini)
   ========================================================= */

let riwayat = [];

function muatRiwayat(){
  try{ riwayat = JSON.parse(localStorage.getItem('riwayatEksplorasi')) || []; }
  catch(e){ riwayat = []; }
  renderRiwayat();
}

function simpanKeRiwayat(na, nb, nc){
  const label = buatLabelFungsi(na, nb, nc);
  if(riwayat.length && riwayat[0].label === label) return; // hindari duplikat berurutan

  riwayat.unshift({ a: na, b: nb, c: nc, label });
  riwayat = riwayat.slice(0, 6);

  try{ localStorage.setItem('riwayatEksplorasi', JSON.stringify(riwayat)); }catch(e){ /* abaikan jika storage penuh/diblokir */ }
  renderRiwayat();
}

function renderRiwayat(){
  const list = el('riwayatList');
  const kosong = el('riwayatKosong');

  if(!riwayat.length){
    kosong.classList.remove('hidden');
    list.innerHTML = '';
    return;
  }

  kosong.classList.add('hidden');
  list.innerHTML = riwayat.map((r, i) => {
    const aktif = (r.a === a && r.b === b && r.c === c) ? ' aktif' : '';
    return `<button type="button" class="riwayat-chip${aktif}" data-index="${i}">${r.label}</button>`;
  }).join('');

  list.querySelectorAll('.riwayat-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const r = riwayat[parseInt(btn.dataset.index, 10)];
      setNilai(r.a, r.b, r.c);
    });
  });
}

/* =========================================================
   TEMA GELAP / TERANG
   ========================================================= */

function inisialisasiTema(){
  let tersimpan = null;
  try{ tersimpan = localStorage.getItem('temaEksplorasi'); }catch(e){ /* abaikan */ }

  aktifkanTema(tersimpan === 'dark');

  ['btnTema', 'btnTemaAwal'].forEach(id => {
    el(id).addEventListener('click', () => {
      const sedangGelap = document.documentElement.getAttribute('data-theme') === 'dark';
      aktifkanTema(!sedangGelap);
    });
  });
}

function aktifkanTema(gelap){
  document.documentElement.setAttribute('data-theme', gelap ? 'dark' : 'light');
  const simbol = gelap ? '☀️' : '🌙';
  el('btnTema').textContent = simbol;
  el('btnTemaAwal').textContent = simbol;
  try{ localStorage.setItem('temaEksplorasi', gelap ? 'dark' : 'light'); }catch(e){ /* abaikan */ }
}

/* =========================================================
   UNDUH HASIL SEBAGAI PDF
   ========================================================= */

function unduhPDF(){

  if(!window.jspdf){
    tampilkanNudge('Gagal memuat pembuat PDF, periksa koneksi internet');
    return;
  }

  const hasil = hitungAnalisis(a, b, c);
  const blokList = dataLangkah(hasil);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const lebar = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = 56;

  const pastikanRuang = (tinggiButuh) => {
    if(y + tinggiButuh > doc.internal.pageSize.getHeight() - 50){
      doc.addPage();
      y = 56;
    }
  };

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 42, 71);
  doc.text('QUANTA — Mode Eksplorasi Fungsi Kuadrat', margin, y);
  y += 22;

  doc.setFont('courier', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 107, 74);
  doc.text(buatLabelFungsi(a, b, c), margin, y);
  y += 18;

  doc.setDrawColor(225, 232, 243);
  doc.line(margin, y, lebar - margin, y);
  y += 22;

  // Grafik
  if(chart){
    const gambar = chart.toBase64Image('image/png', 1);
    const lebarGambar = lebar - margin*2;
    const tinggiGambar = lebarGambar * 0.55;
    pastikanRuang(tinggiGambar + 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 42, 71);
    doc.text('Grafik', margin, y);
    y += 10;
    doc.addImage(gambar, 'PNG', margin, y, lebarGambar, tinggiGambar);
    y += tinggiGambar + 26;
  }

  // Analisis ringkas
  pastikanRuang(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Hasil Analisis', margin, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(60, 70, 95);

  const baris2 = buatBarisRingkasTeks(hasil);
  baris2.forEach(line => {
    pastikanRuang(16);
    doc.text(line, margin, y);
    y += 15;
  });

  y += 12;

  // Cara pengerjaan
  pastikanRuang(26);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 42, 71);
  doc.text('Cara Pengerjaan', margin, y);
  y += 20;

  blokList.forEach(blok => {
    pastikanRuang(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(108, 92, 231);
    doc.text(blok.judul, margin, y);
    y += 16;

    blok.item.forEach(it => {
      const teksBersih = it.teks.replace(/×/g, 'x').replace(/√/g, 'akar ').replace(/≈/g, '=');
      doc.setFont('helvetica', it.tipe === 'ket' ? 'italic' : 'normal');
      doc.setFontSize(10.2);
      doc.setTextColor(it.tipe === 'ket' ? 91 : 30, it.tipe === 'ket' ? 107 : 42, it.tipe === 'ket' ? 137 : 71);

      const prefix = it.tipe === 'ket' ? '' : '   ';
      const baris3 = doc.splitTextToSize(prefix + teksBersih, lebar - margin*2 - 8);
      baris3.forEach(l => {
        pastikanRuang(14);
        doc.text(l, margin + 6, y);
        y += 13.5;
      });
    });
    y += 8;
  });

  // Footer setiap halaman
  const totalHalaman = doc.internal.getNumberOfPages();
  for(let i = 1; i <= totalHalaman; i++){
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(150, 158, 175);
    doc.text(`QUANTA · Mode Eksplorasi — halaman ${i} dari ${totalHalaman}`, margin, doc.internal.pageSize.getHeight() - 28);
  }

  const namaFile = `quanta-eksplorasi-${buatLabelFungsi(a, b, c).replace(/[\s=²]/g, '')}.pdf`;
  doc.save(namaFile);
  tampilkanNudge('PDF berhasil diunduh ✅');
}

function buatBarisRingkasTeks(hasil){
  if(hasil.linear){
    const baris3 = [
      `Gradien (m): ${fmt(hasil.gradien)}`,
      `Titik potong Y: (0, ${fmt(hasil.titikY)})`
    ];
    baris3.push(hasil.akarX !== null
      ? `Titik potong X: (${fmt(hasil.akarX)}, 0)`
      : 'Titik potong X: tidak ada (garis mendatar)');
    return baris3;
  }

  const { a, b, c, xs, yp, D, akar, cekungAtas } = hasil;
  const baris3 = [
    `Koefisien: a=${fmt(a)}, b=${fmt(b)}, c=${fmt(c)}`,
    `Kecekungan: ${cekungAtas ? 'terbuka ke atas (a > 0)' : 'terbuka ke bawah (a < 0)'}`,
    `${cekungAtas ? 'Nilai minimum' : 'Nilai maksimum'}: ${fmt(yp)}`,
    `Sumbu simetri: x = ${fmt(xs)}`,
    `Titik puncak: (${fmt(xs)}, ${fmt(yp)})`,
    `Diskriminan (D): ${fmt(D)}`
  ];

  if(D > 0) baris3.push(`Titik potong X: (${fmt(akar[0])}, 0) dan (${fmt(akar[1])}, 0)`);
  else if(D === 0) baris3.push(`Titik potong X: menyinggung di (${fmt(akar[0])}, 0)`);
  else baris3.push('Titik potong X: tidak ada (D < 0)');

  baris3.push(`Titik potong Y: (0, ${fmt(c)})`);
  baris3.push(`Domain: semua bilangan real`);
  baris3.push(`Range: ${cekungAtas ? `[${fmt(yp)}, ∞)` : `(-∞, ${fmt(yp)}]`}`);
  baris3.push(cekungAtas
    ? `Turun saat x < ${fmt(xs)}, naik saat x > ${fmt(xs)}`
    : `Naik saat x < ${fmt(xs)}, turun saat x > ${fmt(xs)}`);

  return baris3;
}

/* =========================================================
   SALIN HASIL
   ========================================================= */

function buatTeksHasil(){
  const hasil = hitungAnalisis(a, b, c);
  const blokList = dataLangkah(hasil);

  let teks = 'QUANTA — Mode Eksplorasi Fungsi Kuadrat\n';
  teks += buatLabelFungsi(a, b, c) + '\n\n';
  teks += 'CARA PENGERJAAN\n\n';
  teks += renderLangkahTeks(blokList);

  return teks;
}

function salinHasil(){
  const teks = buatTeksHasil();

  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(teks)
      .then(() => tampilkanNudge('Hasil disalin ke clipboard ✅'))
      .catch(() => salinFallback(teks));
  } else {
    salinFallback(teks);
  }
}

function salinFallback(teks){
  const ta = document.createElement('textarea');
  ta.value = teks;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try{
    document.execCommand('copy');
    tampilkanNudge('Hasil disalin ke clipboard ✅');
  }catch(e){
    tampilkanNudge('Gagal menyalin otomatis, coba salin manual');
  }
  document.body.removeChild(ta);
}

/* =========================================================
   EVENT BINDING
   ========================================================= */

function inisialisasi(){

  inisialisasiTema();
  muatRiwayat();

  // slider -> nomor
  el('sliderA').addEventListener('input', () => {
    let v = jagaA(parseFloat(el('sliderA').value), a >= 0);
    a = v;
    el('numA').value = fmt(a);
    el('sliderA').value = clamp(a, -10, 10);
    perbaruiTampilan();
  });
  el('sliderB').addEventListener('input', () => {
    b = parseFloat(el('sliderB').value);
    el('numB').value = fmt(b);
    perbaruiTampilan();
  });
  el('sliderC').addEventListener('input', () => {
    c = parseFloat(el('sliderC').value);
    el('numC').value = fmt(c);
    perbaruiTampilan();
  });

  // saat slider dilepas, baru dicatat ke riwayat (bukan setiap geser kecil)
  ['sliderA','sliderB','sliderC'].forEach(id => {
    el(id).addEventListener('change', () => simpanKeRiwayat(a, b, c));
  });

  // nomor -> slider
  el('numA').addEventListener('input', () => {
    let v = parseFloat(el('numA').value);
    if(isNaN(v)) return;
    a = v;
    el('sliderA').value = clamp(a, -10, 10);
    perbaruiTampilan();
  });
  el('numB').addEventListener('input', () => {
    let v = parseFloat(el('numB').value);
    if(isNaN(v)) return;
    b = v;
    el('sliderB').value = clamp(b, -10, 10);
    perbaruiTampilan();
  });
  el('numC').addEventListener('input', () => {
    let v = parseFloat(el('numC').value);
    if(isNaN(v)) return;
    c = v;
    el('sliderC').value = clamp(c, -10, 10);
    perbaruiTampilan();
  });

  el('numA').addEventListener('blur', () => {
    a = jagaA(a, a >= 0);
    setNilai(a, b, c);
    simpanKeRiwayat(a, b, c);
  });
  el('numB').addEventListener('blur', () => simpanKeRiwayat(a, b, c));
  el('numC').addEventListener('blur', () => simpanKeRiwayat(a, b, c));

  // tombol acak
  el('btnAcak').addEventListener('click', () => {
    let na = (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 4.5);
    let nb = Math.round((Math.random()*20 - 10) * 2) / 2;
    let nc = Math.round((Math.random()*20 - 10) * 2) / 2;
    setNilai(Math.round(na*10)/10, nb, nc);
    simpanKeRiwayat(a, b, c);
  });

  // tombol reset
  el('btnReset').addEventListener('click', () => {
    setNilai(1, 0, 0);
    simpanKeRiwayat(a, b, c);
  });

  // input fungsi manual
  el('btnTerapkan').addEventListener('click', terapkanInputFungsi);
  el('inputFungsi').addEventListener('keydown', (e) => {
    if(e.key === 'Enter') terapkanInputFungsi();
  });

  // salin & unduh PDF
  el('btnSalin').addEventListener('click', salinHasil);
  el('btnUnduhPDF').addEventListener('click', unduhPDF);

  // unduh grafik
  el('btnUnduhGrafik').addEventListener('click', unduhGrafik);

  // navigasi: beranda <-> panduan <-> lab
  el('btnKePanduan').addEventListener('click', () => {
    el('layarAwal').classList.add('hidden');
    el('layarPanduan').classList.remove('hidden');
  });
  el('btnKeAwalDariPanduan').addEventListener('click', () => {
    el('layarPanduan').classList.add('hidden');
    el('layarAwal').classList.remove('hidden');
  });
  el('btnMulai').addEventListener('click', masukKeLab);
  el('btnMulaiDariPanduan').addEventListener('click', masukKeLab);
  el('btnKeAwal').addEventListener('click', kembaliKeAwal);

  perbaruiTampilan();
}

function masukKeLab(){
  el('layarAwal').classList.add('hidden');
  el('layarPanduan').classList.add('hidden');
  el('layarLab').classList.remove('hidden');
  // canvas baru punya ukuran nyata setelah terlihat, jadi gambar ulang grafiknya
  perbaruiTampilan();
}

function kembaliKeAwal(){
  el('layarLab').classList.add('hidden');
  el('layarPanduan').classList.add('hidden');
  el('layarAwal').classList.remove('hidden');
}

function terapkanInputFungsi(){
  const teks = el('inputFungsi').value;
  const pesanError = el('pesanError');

  if(teks.trim() === ''){
    pesanError.classList.add('hidden');
    return;
  }

  const hasil = parseFungsi(teks);

  if(!hasil){
    pesanError.textContent = 'Format fungsi tidak dikenali. Contoh yang benar: y = 2x^2 - 4x + 1';
    pesanError.classList.remove('hidden');
    return;
  }

  pesanError.classList.add('hidden');

  let na = hasil.a;
  if(Math.abs(na) > 10){
    tampilkanNudge('Nilai a dibatasi ke rentang slider (-10 s.d. 10) untuk tampilan, hasil analisis tetap akurat');
  }
  na = jagaA(na, na >= 0);

  setNilai(na, hasil.b, hasil.c);
}

document.addEventListener('DOMContentLoaded', inisialisasi);