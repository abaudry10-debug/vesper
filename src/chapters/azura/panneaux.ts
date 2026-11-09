// Deux panneaux qu'on manipule : le clavier de la porte du centre (le badge d'Oskar, puis le code),
// et le tableau du disjoncteur de la salle des serveurs (remettre le courant dans le bon ordre).
import { sfx } from '../../engine/audio.js';

function style() {
  if (document.getElementById('az-pan-style')) return;
  const st = document.createElement('style');
  st.id = 'az-pan-style';
  st.textContent = `
.az-pan{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;background:rgba(5,4,12,.66)}
.az-pan .panel{width:90%;max-width:360px;max-height:94%;overflow:auto;padding:12px 12px 10px;text-align:center}
.az-pan h3{font-family:var(--font);font-size:20px;color:var(--teal);margin:0 0 8px;letter-spacing:.05em}
.az-pan .screen{font-family:var(--font);background:#06141a;border:2px solid #14101c;color:#5ff0e0;padding:6px;margin:0 0 8px;font-size:18px;min-height:24px}
.az-pan .digits{font-family:var(--font);font-size:34px;letter-spacing:.35em;color:#d8fffa;background:#06141a;border:2px solid #14101c;padding:4px 0 4px .35em;margin:0 0 8px}
.az-pan .keys{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:0 0 10px}
.az-pan .keys button{font-family:var(--font);font-size:24px;padding:8px 0;background:#2a2436;color:#f2e9dc;border:2px solid #14101c;border-bottom-width:4px;border-radius:4px}
.az-pan .keys button:active{transform:translateY(2px);border-bottom-width:2px}
.az-pan .label{font-family:var(--font);text-align:left;background:#e8dcc0;color:#2a2436;padding:8px 10px;margin:0 0 10px;font-size:15px;line-height:1.3;border:2px solid #14101c}
.az-pan .label b{font-weight:normal;color:#8a2a2a}
.az-pan .label .stain{color:#a8987a;letter-spacing:-.05em}
.az-pan .label .wet{color:#6a6050;font-style:italic}
.az-pan .switches{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:0 0 8px}
.az-pan .sw{font-family:var(--font);font-size:12px;line-height:1.1;padding:6px 2px;background:#3a3448;color:#f2e9dc;border:2px solid #14101c;border-radius:3px;display:flex;flex-direction:column;align-items:center;gap:5px;min-height:96px}
.az-pan .sw .led{width:10px;height:10px;background:#3a1a1a;border:1px solid #14101c}
.az-pan .sw.on .led{background:#5ff0e0;box-shadow:0 0 6px #5ff0e0}
.az-pan .sw .lever{width:14px;height:28px;background:#14101c;position:relative}
.az-pan .sw .lever::after{content:'';position:absolute;left:2px;width:10px;height:12px;background:#c8ccd4;bottom:2px}
.az-pan .sw.on .lever::after{bottom:14px;background:#ffd45e}
.az-pan .general{width:100%;font-family:var(--font);font-size:18px;padding:8px;margin:0 0 8px;background:#5a2a2a;color:#f2e9dc;border:2px solid #14101c;border-radius:3px}
.az-pan .general.on{background:#2a6a5a}
.az-pan .status{font-family:var(--font);font-size:16px;color:#f2e9dc;min-height:40px;margin:0 0 8px;line-height:1.25}
.az-pan .status.bad{color:#ff7a7a}
.az-pan .menu{width:100%}`;
  document.head.appendChild(st);
}

function mount(html: string) {
  style();
  const host = document.getElementById('app') ?? document.body; // hors de #screen : les touchers y servent aux commandes
  const el = document.createElement('div');
  el.className = 'az-pan';
  el.innerHTML = `<div class="panel">${html}</div>`;
  host.appendChild(el);
  return el;
}

/** Le lecteur de badge de la porte du centre : quatre chiffres. `check` dit si le code est le bon. */
export function openKeypad(check: (code: string) => boolean, done: (ok: boolean, fails: number) => void) {
  const el = mount(`<h3>CENTRE DE CLONAGE</h3><div class="screen">BADGE AU-04 RECONNU — CODE ?</div><div class="digits">____</div>
    <div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-k="${n}">${n}</button>`).join('')}<button data-k="del">←</button><button data-k="0">0</button><button data-k="ok">OK</button></div>
    <button class="menu no">Fermer</button>`);
  const screen = el.querySelector('.screen') as HTMLElement, digits = el.querySelector('.digits') as HTMLElement;
  let code = '', fails = 0, busy = false;
  const show = () => (digits.textContent = (code + '____').slice(0, 4));
  const close = (ok: boolean) => {
    window.removeEventListener('keydown', key, true);
    el.remove();
    done(ok, fails);
  };
  const press = (k: string) => {
    if (busy) return;
    if (k === 'del') code = code.slice(0, -1);
    else if (k === 'ok') {
      if (code.length < 4) return;
      if (check(code)) {
        busy = true;
        sfx.success();
        screen.textContent = 'ACCÈS AUTORISÉ';
        window.setTimeout(() => close(true), 900);
        return;
      }
      fails++;
      sfx.bump();
      screen.textContent = 'CODE REFUSÉ';
      screen.style.color = '#ff7a7a';
      busy = true;
      window.setTimeout(() => {
        busy = false;
        code = '';
        show();
        screen.textContent = 'BADGE AU-04 RECONNU — CODE ?';
        screen.style.color = '';
      }, 900);
    } else if (code.length < 4) {
      code += k;
      sfx.select();
    }
    show();
  };
  const key = (ev: KeyboardEvent) => {
    if (/^[0-9]$/.test(ev.key)) press(ev.key);
    else if (ev.key === 'Backspace') press('del');
    else if (ev.key === 'Enter') press('ok');
    else if (ev.key === 'Escape') close(false);
    else return;
    ev.preventDefault();
    ev.stopPropagation();
  };
  window.addEventListener('keydown', key, true);
  el.querySelectorAll<HTMLButtonElement>('.keys button').forEach((b) => (b.onclick = () => press(b.dataset.k!)));
  (el.querySelector('.no') as HTMLButtonElement).onclick = () => close(false);
}

// ---------- le disjoncteur ----------
type Circuit = 'serveurs' | 'eclairage' | 'coeur' | 'ventilation';
const NAMES: Record<Circuit, string> = { serveurs: 'SERVEURS', eclairage: 'ÉCLAIRAGE', coeur: 'CŒUR DE MÉMOIRE', ventilation: 'VENTILATION' };
/** Le bon ordre, une fois le général relevé : on ne lance les serveurs qu'avec la ventilation, et le cœur (qui lit les serveurs) en dernier. */
const ORDER: Circuit[] = ['eclairage', 'ventilation', 'serveurs', 'coeur'];
const OK_TEXT: Record<Circuit, string> = {
  eclairage: 'Les néons grésillent… puis s’allument, un à un.',
  ventilation: 'Un souffle : les ventilateurs se mettent à tourner.',
  serveurs: 'Les armoires ronronnent. Des voyants s’allument partout.',
  coeur: 'Au centre de la salle, le cœur de mémoire s’éclaire.',
};

export function openBreaker(done: (ok: boolean) => void) {
  const panel: Circuit[] = ['serveurs', 'eclairage', 'coeur', 'ventilation'];
  const el = mount(`<h3>DISJONCTEUR — SALLE DES SERVEURS</h3>
    <div class="label">PROCÉDURE DE REMISE SOUS TENSION<br>
      1. Relever le <b>GÉNÉRAL</b>.<br>2. <b>ÉCLAIRAGE</b>.<br>3. <span class="stain">▒▒▒▒▒▒▒▒</span><br>4. <span class="stain">▒▒▒▒▒▒</span><br>5. <span class="stain">▒▒▒▒▒▒▒▒▒▒▒</span><br>
      <span class="wet">…ne jamais alimenter les <b>SERVEURS</b> sans la <b>VENTIL</b>▒▒▒▒…<br>…le <b>CŒUR</b> lit les serveurs : il dé▒▒▒▒re en ▒▒▒▒ier.</span></div>
    <button class="general">GÉNÉRAL — COUPÉ</button>
    <div class="switches">${panel.map((k) => `<button class="sw" data-k="${k}"><span class="led"></span><span class="lever"></span>${NAMES[k]}</button>`).join('')}</div>
    <p class="status">Tout est coupé. Une odeur d’eau et de poussière.</p>
    <button class="menu no">Fermer</button>`);
  const status = el.querySelector('.status') as HTMLElement, gen = el.querySelector('.general') as HTMLButtonElement;
  let general = false, busy = false;
  let on: Circuit[] = [];
  const paint = () => {
    gen.classList.toggle('on', general);
    gen.textContent = general ? 'GÉNÉRAL — RELEVÉ' : 'GÉNÉRAL — COUPÉ';
    el.querySelectorAll<HTMLButtonElement>('.sw').forEach((b) => b.classList.toggle('on', on.includes(b.dataset.k as Circuit)));
  };
  const say = (t: string, bad = false) => {
    status.textContent = t;
    status.classList.toggle('bad', bad);
  };
  const close = (ok: boolean) => {
    el.remove();
    done(ok);
  };
  const trip = (why: string) => {
    sfx.bump();
    on.push(why as Circuit);
    paint();
    busy = true;
    window.setTimeout(() => {
      general = false;
      on = [];
      busy = false;
      paint();
      say('CLAC ! Tout saute. Une odeur de brûlé… Tout est de nouveau coupé.', true);
    }, 350);
  };
  gen.onclick = () => {
    if (busy || general) return;
    general = true;
    sfx.select();
    paint();
    say('Le général est relevé. Un bourdonnement sourd, dans les murs.');
  };
  el.querySelectorAll<HTMLButtonElement>('.sw').forEach((b) => {
    b.onclick = () => {
      const k = b.dataset.k as Circuit;
      if (busy || on.includes(k)) return;
      if (!general) {
        sfx.bump();
        return say('Le levier bascule… Rien. Le courant général est coupé.');
      }
      if (k !== ORDER[on.length]) return trip(k);
      on.push(k);
      sfx.select();
      paint();
      say(OK_TEXT[k]);
      if (on.length === ORDER.length) {
        busy = true;
        window.setTimeout(() => {
          sfx.success();
          close(true);
        }, 1300);
      }
    };
  });
  (el.querySelector('.no') as HTMLButtonElement).onclick = () => close(false);
}
