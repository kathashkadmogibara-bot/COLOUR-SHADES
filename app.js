/* MOGIBARA COLOR SHADES — colour engine + page logic */

/* ---------- conversions ---------- */
function clamp(v, a, b){ return Math.min(b, Math.max(a, v)); }
function hsvToRgb(h, s, v){
  h = ((h % 360) + 360) % 360; s = clamp(s,0,100)/100; v = clamp(v,0,100)/100;
  const c = v*s, x = c*(1-Math.abs((h/60)%2-1)), m = v-c;
  let r=0,g=0,b=0;
  if (h<60){r=c;g=x;b=0;} else if (h<120){r=x;g=c;b=0;}
  else if (h<180){r=0;g=c;b=x;} else if (h<240){r=0;g=x;b=c;}
  else if (h<300){r=x;g=0;b=c;} else {r=c;g=0;b=x;}
  return { r: Math.round((r+m)*255), g: Math.round((g+m)*255), b: Math.round((b+m)*255) };
}
function rgbToHsv(r,g,b){
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min;
  let h=0;
  if (d!==0){
    if (max===r) h = 60*(((g-b)/d)%6);
    else if (max===g) h = 60*((b-r)/d+2);
    else h = 60*((r-g)/d+4);
  }
  if (h<0) h+=360;
  const s = max===0 ? 0 : d/max;
  return { h: Math.round(h), s: Math.round(s*100), v: Math.round(max*100) };
}
function rgbToHex(r,g,b){
  const h = n => clamp(Math.round(n),0,255).toString(16).padStart(2,'0');
  return '#' + h(r)+h(g)+h(b);
}
function hexToRgb(hex){
  hex = (hex||'').trim().replace(/^#/,'');
  if (hex.length===3) hex = hex.split('').map(c=>c+c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const num = parseInt(hex,16);
  return { r:(num>>16)&255, g:(num>>8)&255, b:num&255 };
}
function rgbToCmyk(r,g,b){
  r/=255; g/=255; b/=255;
  const k = 1-Math.max(r,g,b);
  if (k>=1) return { c:0,m:0,y:0,k:100 };
  const c = (1-r-k)/(1-k), m = (1-g-k)/(1-k), y = (1-b-k)/(1-k);
  return { c:Math.round(c*100), m:Math.round(m*100), y:Math.round(y*100), k:Math.round(k*100) };
}
function rgbToHsl(r,g,b){
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h=0,s=0; const l=(max+min)/2; const d = max-min;
  if (d!==0){
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    if (max===r) h = 60*(((g-b)/d)%6);
    else if (max===g) h = 60*((b-r)/d+2);
    else h = 60*((r-g)/d+4);
  }
  if (h<0) h+=360;
  return { h:Math.round(h), s:Math.round(s*100), l:Math.round(l*100) };
}
function isDark(r,g,b){ return (0.299*r + 0.587*g + 0.114*b) < 140; }

/* ---------- named colours, for showing a friendly name in the modal ---------- */
const NAMED_COLORS = [
["Black","#000000"],["White","#FFFFFF"],["Red","#FF0000"],["Lime","#00FF00"],["Blue","#0000FF"],
["Yellow","#FFFF00"],["Cyan","#00FFFF"],["Magenta","#FF00FF"],["Silver","#C0C0C0"],["Gray","#808080"],
["Maroon","#800000"],["Olive","#808000"],["Green","#008000"],["Purple","#800080"],["Teal","#008080"],
["Navy","#000080"],["Orange","#FFA500"],["Pink","#FFC0CB"],["Hot Pink","#FF69B4"],["Deep Pink","#FF1493"],
["Crimson","#DC143C"],["Firebrick","#B22222"],["Dark Red","#8B0000"],["Salmon","#FA8072"],
["Tomato","#FF6347"],["Coral","#FF7F50"],["Orange Red","#FF4500"],["Dark Orange","#FF8C00"],
["Gold","#FFD700"],["Khaki","#F0E68C"],["Goldenrod","#DAA520"],["Chocolate","#D2691E"],
["Sienna","#A0522D"],["Brown","#A52A2A"],["Saddle Brown","#8B4513"],["Tan","#D2B48C"],["Beige","#F5F5DC"],
["Ivory","#FFFFF0"],["Lavender","#E6E6FA"],["Yellow Green","#9ACD32"],["Chartreuse","#7FFF00"],
["Spring Green","#00FF7F"],["Light Green","#90EE90"],["Sea Green","#2E8B57"],["Forest Green","#228B22"],
["Dark Green","#006400"],["Lime Green","#32CD32"],["Turquoise","#40E0D0"],["Cadet Blue","#5F9EA0"],
["Sky Blue","#87CEEB"],["Deep Sky Blue","#00BFFF"],["Dodger Blue","#1E90FF"],["Steel Blue","#4682B4"],
["Royal Blue","#4169E1"],["Dark Blue","#00008B"],["Midnight Blue","#191970"],["Slate Blue","#6A5ACD"],
["Indigo","#4B0082"],["Violet","#EE82EE"],["Orchid","#DA70D6"],["Dark Orchid","#9932CC"],
["Blue Violet","#8A2BE2"],["Medium Purple","#9370DB"],["Charcoal","#36454F"],["Emerald","#50C878"],
["Jade","#00A86B"],["Sapphire","#0F52BA"],["Amber","#FFBF00"],["Ruby","#E0115F"],["Mint","#98FF98"],
["Peach","#FFE5B4"],["Apricot","#FBCEB1"],["Mauve","#E0B0FF"],["Burgundy","#800020"],
["Cerulean","#007BA7"],["Cobalt Blue","#0047AB"],["Mustard","#FFDB58"],["Periwinkle","#CCCCFF"]
];
function nearestColourName(r,g,b){
  let best=null, bestD=Infinity;
  for (const [name, hex] of NAMED_COLORS){
    const c = hexToRgb(hex);
    const d = (c.r-r)**2 + (c.g-g)**2 + (c.b-b)**2;
    if (d<bestD){ bestD=d; best=name; }
  }
  return best;
}

/* ---------- curated palettes (5 colours each, hand-picked) ---------- */
const PALETTES = [
["Sunset Boulevard", ["#2B2D42","#8D99AE","#EDF2F4","#EF233C","#D90429"]],
["Ocean Breeze", ["#03045E","#0077B6","#00B4D8","#90E0EF","#CAF0F8"]],
["Desert Clay", ["#582F0E","#7F4F24","#936639","#A68A64","#B6AD90"]],
["Forest Floor", ["#081C15","#1B4332","#2D6A4F","#40916C","#74C69D"]],
["Candy Pop", ["#FF006E","#FB5607","#FFBE0B","#8338EC","#3A86FF"]],
["Autumn Harvest", ["#432818","#6F1D1B","#BB9457","#99582A","#432818"]],
["Mint Fresh", ["#D8F3DC","#B7E4C7","#95D5B2","#74C69D","#52B788"]],
["Royal Velvet", ["#10002B","#240046","#3C096C","#5A189A","#7B2CBF"]],
["Peach Sorbet", ["#FFCDB2","#FFB4A2","#E5989B","#B5838D","#6D6875"]],
["Midnight Tech", ["#0B132B","#1C2541","#3A506B","#5BC0BE","#6FFFE9"]],
["Golden Hour", ["#FFF3B0","#E09F3E","#9E2A2B","#540B0E","#335C67"]],
["Berry Smoothie", ["#390099","#9E0059","#FF0054","#FF5400","#FFBD00"]],
["Sage & Cream", ["#CCD5AE","#E9EDC9","#FEFAE0","#FAEDCD","#D4A373"]],
["Deep Space", ["#000814","#001D3D","#003566","#FFC300","#FFD60A"]],
["Rosewater", ["#FFE5EC","#FFC2D1","#FFB3C6","#FF8FAB","#FB6F92"]],
["Coral Reef", ["#F72585","#B5179E","#7209B7","#560BAD","#480CA8"]],
["Earthy Olive", ["#606C38","#283618","#FEFAE0","#DDA15E","#BC6C25"]],
["Cool Slate", ["#CED4DA","#ADB5BD","#6C757D","#495057","#212529"]],
["Tropical Punch", ["#F94144","#F3722C","#F9C74F","#90BE6D","#43AA8B"]],
["Lavender Dream", ["#E0AAFF","#C77DFF","#9D4EDD","#7B2CBF","#5A189A"]],
["Citrus Burst", ["#FFBA08","#FAA307","#F48C06","#E85D04","#DC2F02"]],
["Nordic Frost", ["#EDF6F9","#D9ED92","#99D98C","#52B69A","#168AAD"]],
["Dusty Rose", ["#9A8C98","#C9ADA7","#F2E9E4","#4A4E69","#22223B"]],
["Neon Nights", ["#F72585","#7209B7","#3A0CA3","#4361EE","#4CC9F0"]]
];

/* ---------- generate a 5-colour palette from a base colour ----------
   Each call produces a different, slightly randomised variation, so
   pressing Generate again on the same base colour gives a fresh palette
   instead of repeating the same one. ---------- */
function rand(min, max){ return min + Math.random()*(max-min); }

function generateFromBase(hex){
  const base = hexToRgb(hex) || {r:11,g:159,b:222};
  const hsv = rgbToHsv(base.r, base.g, base.b);

  // pick a random "mood" for this generation so repeated clicks feel different
  const moods = ['analogous', 'complementary', 'triadic', 'shades'];
  const mood = moods[Math.floor(Math.random()*moods.length)];

  const jitterH = () => rand(-10, 10);
  const jitterS = () => rand(-10, 10);
  const jitterV = () => rand(-10, 10);

  let combos;
  if (mood === 'analogous'){
    combos = [
      { h: hsv.h, s: hsv.s, v: hsv.v },
      { h: (hsv.h + rand(20,45) + 360)%360, s: clamp(hsv.s+jitterS(),20,100), v: clamp(hsv.v+jitterV(),20,100) },
      { h: (hsv.h - rand(20,45) + 360)%360, s: clamp(hsv.s+jitterS(),20,100), v: clamp(hsv.v+jitterV(),20,100) },
      { h: (hsv.h + rand(45,70) + 360)%360, s: clamp(hsv.s-15+jitterS(),15,100), v: clamp(hsv.v-10+jitterV(),20,100) },
      { h: hsv.h, s: clamp(hsv.s-35+jitterS(),10,100), v: clamp(hsv.v+25+jitterV(),30,100) },
    ];
  } else if (mood === 'complementary'){
    combos = [
      { h: hsv.h, s: hsv.s, v: hsv.v },
      { h: (hsv.h+180+jitterH())%360, s: clamp(hsv.s+jitterS(),20,100), v: clamp(hsv.v+jitterV(),20,100) },
      { h: (hsv.h+rand(10,25))%360, s: clamp(hsv.s-20+jitterS(),15,100), v: clamp(hsv.v+15+jitterV(),25,100) },
      { h: (hsv.h+180-rand(10,25)+360)%360, s: clamp(hsv.s-10+jitterS(),15,100), v: clamp(hsv.v-15+jitterV(),20,100) },
      { h: hsv.h, s: clamp(hsv.s-45+jitterS(),10,100), v: clamp(hsv.v+30+jitterV(),35,100) },
    ];
  } else if (mood === 'triadic'){
    combos = [
      { h: hsv.h, s: hsv.s, v: hsv.v },
      { h: (hsv.h+120+jitterH())%360, s: clamp(hsv.s+jitterS(),20,100), v: clamp(hsv.v+jitterV(),20,100) },
      { h: (hsv.h+240+jitterH())%360, s: clamp(hsv.s+jitterS(),20,100), v: clamp(hsv.v+jitterV(),20,100) },
      { h: hsv.h, s: clamp(hsv.s-20+jitterS(),15,100), v: clamp(hsv.v+20+jitterV(),25,100) },
      { h: (hsv.h+120)%360, s: clamp(hsv.s-30+jitterS(),10,100), v: clamp(hsv.v-20+jitterV(),15,100) },
    ];
  } else { // shades — tints & tones of the same hue
    combos = [
      { h: hsv.h, s: hsv.s, v: hsv.v },
      { h: hsv.h+jitterH(), s: clamp(hsv.s+rand(-15,5),10,100), v: clamp(hsv.v+rand(20,35),30,100) },
      { h: hsv.h+jitterH(), s: clamp(hsv.s+rand(-10,10),10,100), v: clamp(hsv.v-rand(20,35),10,95) },
      { h: hsv.h+jitterH(), s: clamp(hsv.s-rand(25,45),5,100), v: clamp(hsv.v+rand(5,20),20,100) },
      { h: hsv.h+jitterH(), s: clamp(hsv.s+rand(5,20),10,100), v: clamp(hsv.v-rand(5,20),10,95) },
    ];
  }

  return combos.map(c => {
    const rgb = hsvToRgb(c.h, c.s, c.v);
    return rgbToHex(rgb.r, rgb.g, rgb.b).toUpperCase();
  });
}

/* ---------- toast + copy ---------- */
function toast(msg){
  let t = document.getElementById('mgToast');
  if (!t){ t = document.createElement('div'); t.id='mgToast'; t.className='mg-toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove('show'), 1400);
}
function copyText(text, label){
  const done = () => toast((label ? label + ' ' : '') + 'Copied!');
  if (navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(text).then(done).catch(()=>fallbackCopy(text, done));
  } else fallbackCopy(text, done);
}
function fallbackCopy(text, done){
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); } catch(e){}
  document.body.removeChild(ta);
  done();
}

/* ================= page logic ================= */

/* ---- generator ---- */
const genHexInput = document.getElementById('genHex');
const genColourInput = document.getElementById('genColour');
const genResult = document.getElementById('genResult');

function runGenerate(hex){
  const list = generateFromBase(hex);
  genResult.innerHTML = '';
  list.forEach(h => {
    const rgb = hexToRgb(h);
    const d = document.createElement('div');
    d.className = 'gswatch';
    d.style.background = h;
    d.innerHTML = `<span style="color:${isDark(rgb.r,rgb.g,rgb.b)?'#fff':'#111'}">${h}</span>`;
    d.addEventListener('click', ()=> openModal(nearestColourName(rgb.r,rgb.g,rgb.b), h));
    genResult.appendChild(d);
  });
}

document.getElementById('genBtn').addEventListener('click', ()=>{
  const rgb = hexToRgb(genHexInput.value);
  if (!rgb){ toast('Type a valid hex, e.g. 0B9FDE'); return; }
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b).toUpperCase();
  genColourInput.value = hex;
  runGenerate(hex);
});
genColourInput.addEventListener('input', ()=>{
  genHexInput.value = genColourInput.value.replace('#','').toUpperCase();
  runGenerate(genColourInput.value);
});
genHexInput.addEventListener('keydown', (e)=>{
  if (e.key === 'Enter') document.getElementById('genBtn').click();
});

/* ---- curated palettes grid ---- */
const paletteGrid = document.getElementById('paletteGrid');
PALETTES.forEach(([name, colors]) => {
  const card = document.createElement('div');
  card.className = 'palette-card';
  const strip = document.createElement('div');
  strip.className = 'palette-strip';
  colors.forEach(hex => {
    const sw = document.createElement('div');
    sw.className = 'pswatch';
    sw.style.background = hex;
    const rgb = hexToRgb(hex);
    sw.addEventListener('click', ()=> openModal(nearestColourName(rgb.r,rgb.g,rgb.b), hex));
    strip.appendChild(sw);
  });
  const label = document.createElement('div');
  label.className = 'palette-name';
  label.textContent = name;
  card.appendChild(strip);
  card.appendChild(label);
  paletteGrid.appendChild(card);
});

/* ---- modal ---- */
const backdrop = document.getElementById('modalBackdrop');
function openModal(name, hex){
  const rgb = hexToRgb(hex);
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  document.getElementById('modalSwatch').style.background = hex;
  document.getElementById('modalTitle').textContent = name;
  document.getElementById('mHex').value = hex.toUpperCase();
  document.getElementById('mRgb').value = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
  document.getElementById('mCmyk').value = `${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%`;
  document.getElementById('mHsv').value = `${hsv.h}°, ${hsv.s}%, ${hsv.v}%`;
  document.getElementById('mHsl').value = `${hsl.h}°, ${hsl.s}%, ${hsl.l}%`;
  document.getElementById('mOpenPicker').href = '../picker/index.html?hex=' + hex.replace('#','');

  backdrop.classList.add('show');
}
document.getElementById('modalClose').addEventListener('click', ()=> backdrop.classList.remove('show'));
backdrop.addEventListener('click', (e)=>{ if (e.target===backdrop) backdrop.classList.remove('show'); });

document.querySelectorAll('[data-mcopy]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const type = btn.dataset.mcopy;
    const map = { hex:'mHex', rgb:'mRgb', cmyk:'mCmyk', hsv:'mHsv', hsl:'mHsl' };
    copyText(document.getElementById(map[type]).value, type.toUpperCase());
  });
});

/* ---- init ---- */
(function init(){
  const params = new URLSearchParams(location.search);
  const hex = params.get('hex');
  const start = (hex && hexToRgb(hex)) ? '#'+hex.replace('#','').toUpperCase() : '#0B9FDE';
  genColourInput.value = start;
  genHexInput.value = start.replace('#','');
  runGenerate(start);
})();
