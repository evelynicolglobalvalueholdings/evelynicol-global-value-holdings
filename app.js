const SUPABASE_URL='https://aniqsyffijcfjevtbzwj.supabase.co';
const SUPABASE_KEY='sb_publishable_J76ebmjttv5YPuB8eaTohQ_8AdAE0Nn';
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
async function loadPublic(){
 const [{data:c},{data:p},{data:a},{data:r},{data:s}]=await Promise.all([
  db.from('capital').select('*').eq('is_public',true),db.from('portfolio').select('*').eq('is_public',true),
  db.from('company_analyses').select('*').eq('is_public',true),db.from('reports').select('*').eq('is_public',true).order('published_at',{ascending:false}),
  db.from('site_content').select('*').eq('is_public',true)
 ]);
 const cap=(c||[]).find(x=>x.label==='Capital inițial'); if(cap) $('#capital').textContent=new Intl.NumberFormat('ro-RO',{style:'currency',currency:cap.currency||'EUR',maximumFractionDigits:0}).format(cap.amount);
 const identity=(s||[]).find(x=>x.key==='identity'); if(identity){if(identity.body) $('#heroTitle').innerHTML=esc(identity.body); if(identity.data?.target_shareholders) $('#target').textContent=identity.data.target_shareholders}
 const invested=(p||[]).reduce((n,x)=>n+Number(x.quantity||0)*Number(x.avg_cost||0),0); $('#invested').textContent=new Intl.NumberFormat('ro-RO',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(invested);
 $('#portfolio').innerHTML=p?.length?'<table><thead><tr><th>Simbol</th><th>Companie</th><th>Piață</th><th>Cantitate</th><th>Cost mediu</th></tr></thead><tbody>'+p.map(x=>`<tr><td>${esc(x.symbol)}</td><td>${esc(x.company_name)}</td><td>${esc(x.market)}</td><td>${esc(x.quantity)}</td><td>${esc(x.avg_cost)} ${esc(x.currency)}</td></tr>`).join('')+'</tbody></table>':'<div class="empty">Nu există încă investiții publicate. Capitalul rămâne disponibil până când apare o oportunitate care îndeplinește criteriile holdingului.</div>';
 $('#analyses').innerHTML=a?.length?a.map(x=>`<article><h3>${esc(x.company_name||x.symbol)}</h3><p>EQS: <b>${['business_quality','profitability','balance_sheet','cash_flow','competitive_advantage','management_capital_allocation','valuation'].reduce((n,k)=>n+Number(x[k]||0),0)}/100</b></p><p>${esc(x.thesis||'')}</p></article>`).join(''):'<div class="empty">Analizele publice vor apărea aici după aprobarea lor.</div>';
 $('#reports').innerHTML=r?.length?r.map(x=>`<article><h3>${esc(x.title)}</h3><small>${esc(x.period||'')}</small><p>${esc(x.body||'')}</p></article>`).join(''):'<div class="empty">Nu există încă rapoarte publicate.</div>';
}
const modal=$('#modal'); $('#adminBtn').onclick=()=>modal.classList.remove('hidden'); $('#close').onclick=()=>modal.classList.add('hidden');
$('#loginForm').onsubmit=async e=>{e.preventDefault();$('#loginMsg').textContent='Se verifică…';const {error}=await db.auth.signInWithPassword({email:$('#email').value,password:$('#password').value});if(error){$('#loginMsg').textContent='Autentificare nereușită.'}else{await showAdmin()}};
$('#logout').onclick=async()=>{await db.auth.signOut();$('#adminView').classList.add('hidden');$('#loginView').classList.remove('hidden')};
const modules={
 site_content:{label:'Site',fields:['key','title','body','is_public','sort_order']},
 capital:{label:'Capital',fields:['label','amount','currency','is_public']},
 shareholders:{label:'Acționari',fields:['display_name','share_class','shares','participation_pct','notes','is_public']},
 portfolio:{label:'Portofoliu',fields:['symbol','company_name','market','quantity','avg_cost','currency','notes','is_public']},
 company_analyses:{label:'Analize EQS',fields:['symbol','company_name','market','business_quality','profitability','balance_sheet','cash_flow','competitive_advantage','management_capital_allocation','valuation','thesis','is_public']},
 watchlist:{label:'Watchlist',fields:['symbol','company_name','market','target_price','currency','notes','is_public']},
 transactions:{label:'Tranzacții',fields:['date','type','symbol','description','quantity','price','amount','currency','is_public']},
 reports:{label:'Rapoarte',fields:['title','period','body','published_at','is_public']},
 founder_journal:{label:'Jurnal',fields:['title','body','published_at','is_public']}
}; let current='site_content';
async function showAdmin(){const {data:{session}}=await db.auth.getSession();if(!session)return;$('#loginView').classList.add('hidden');$('#adminView').classList.remove('hidden');$('#adminTabs').innerHTML=Object.entries(modules).map(([k,v])=>`<button data-k="${k}">${v.label}</button>`).join('');document.querySelectorAll('#adminTabs button').forEach(b=>b.onclick=()=>renderModule(b.dataset.k));renderModule(current)}
function inputFor(f){if(f==='is_public')return `<label><input name="${f}" type="checkbox"> Public</label>`;if(['body','notes','thesis'].includes(f))return `<textarea name="${f}" placeholder="${f}"></textarea>`;let type=['amount','shares','participation_pct','quantity','avg_cost','target_price','price','business_quality','profitability','balance_sheet','cash_flow','competitive_advantage','management_capital_allocation','valuation','sort_order'].includes(f)?'number':f.includes('date')?'date':'text';return `<input name="${f}" type="${type}" step="any" placeholder="${f}">`}
async function renderModule(k){current=k;document.querySelectorAll('#adminTabs button').forEach(b=>b.classList.toggle('active',b.dataset.k===k));const m=modules[k];$('#adminContent').innerHTML=`<form id="crudForm" class="adminform">${m.fields.map(inputFor).join('')}<button class="wide">Adaugă</button></form><div id="crudMsg"></div><div id="adminList" class="adminlist">Se încarcă…</div>`;$('#crudForm').onsubmit=saveRow;await listRows()}
async function listRows(){const {data,error}=await db.from(current).select('*').order('created_at',{ascending:false,nullsFirst:false}).limit(100);if(error){$('#adminList').textContent=error.message;return}$('#adminList').innerHTML=data?.length?data.map(x=>`<div class="row"><div><b>${esc(x.title||x.company_name||x.display_name||x.label||x.symbol||x.key||x.type||'Înregistrare')}</b><br><small>${esc(x.body||x.notes||x.description||x.period||'')}</small></div><button data-del="${x.id}">Șterge</button></div>`).join(''):'<div class="empty">Nicio înregistrare.</div>';document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>delRow(b.dataset.del))}
async function saveRow(e){e.preventDefault();const fd=new FormData(e.target),obj={};for(const f of modules[current].fields){const el=e.target.elements[f];if(f==='is_public')obj[f]=el.checked;else if(el.value!=='')obj[f]=el.type==='number'?Number(el.value):el.value}const {error}=await db.from(current).insert(obj);$('#crudMsg').textContent=error?error.message:'Salvat.';if(!error){e.target.reset();await listRows();await loadPublic()}}
async function delRow(id){if(!confirm('Ștergi această înregistrare?'))return;const {error}=await db.from(current).delete().eq('id',id);if(error)alert(error.message);else{await listRows();await loadPublic()}}
db.auth.getSession().then(({data})=>{if(data.session)showAdmin()});loadPublic();