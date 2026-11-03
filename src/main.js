import JSZip from 'jszip'
import './style.css'

const STORE_KEY = 'rusted-mod-studio-v1'

const starter = {
  meta: { name: 'Mi primer mod', id: 'mi_primer_mod', version: '1.0', author: 'Creador', description: 'Proyecto creado con Rusted Mod Studio.' },
  factions: [
    { id: 'industria', name: 'Industria', color: '#4f9bff', description: 'Producción y logística.', startingCredits: 1200, income: 8, buildSpeed: 1, strengths: 'Economía y construcción', weaknesses: 'Unidades costosas' },
    { id: 'defensa', name: 'Defensa', color: '#43c59e', description: 'Resistencia y protección.', startingCredits: 1000, income: 7, buildSpeed: 0.9, strengths: 'Defensas y durabilidad', weaknesses: 'Expansión lenta' },
    { id: 'tecnologia', name: 'Tecnología', color: '#b18cff', description: 'Investigación y unidades avanzadas.', startingCredits: 900, income: 6, buildSpeed: 1.1, strengths: 'Tecnología y movilidad', weaknesses: 'Economía inicial limitada' }
  ],
  units: [
    { id: 'trabajador', name: 'Trabajador', faction: 'industria', category: 'Constructor', hp: 220, cost: 150, buildTime: 8, description: 'Unidad básica de construcción.' }
  ],
  buildings: [
    { id: 'centro_civico', name: 'Centro cívico', faction: 'industria', category: 'Centro', hp: 1800, cost: 900, buildTime: 35, income: 4, description: 'Centro administrativo de la nación.' }
  ]
}

let project = loadProject()
let activeTab = 'dashboard'
let editorType = 'units'
let editingId = null

function clone(value) { return JSON.parse(JSON.stringify(value)) }
function loadProject() {
  try {
    const saved = localStorage.getItem(STORE_KEY)
    return saved ? JSON.parse(saved) : clone(starter)
  } catch { return clone(starter) }
}
function saveProject() {
  localStorage.setItem(STORE_KEY, JSON.stringify(project))
  const el = document.querySelector('#save-state')
  if (el) el.textContent = 'Guardado local'
}
function esc(value = '') {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
}
function slug(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '')
}
function fmt(n) { return Number(n || 0).toLocaleString('es-ES') }
function setTab(tab) { activeTab = tab; render() }

function render() {
  const app = document.querySelector('#app')
  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand"><div class="brand-mark">R</div><div><strong>RUSTED</strong><span>MOD STUDIO</span></div></div>
        <div class="project-chip"><span class="dot"></span><div><small>PROYECTO ACTIVO</small><strong>${esc(project.meta.name)}</strong></div></div>
        <nav>
          <p class="nav-label">ESPACIO DE TRABAJO</p>
          ${navItem('dashboard','▦','Resumen')}
          ${navItem('project','▤','Proyecto')}
          <p class="nav-label">DISEÑO DEL MOD</p>
          ${navItem('units','◈','Unidades', project.units.length)}
          ${navItem('buildings','▥','Edificios', project.buildings.length)}
          ${navItem('factions','⬡','Facciones', project.factions.length)}
          ${navItem('economy','⌁','Economía')}
          <p class="nav-label">CONTROL Y ENTREGA</p>
          ${navItem('validator','✓','Validador')}
          ${navItem('export','⇧','Exportar')}
        </nav>
        <div class="sidebar-bottom"><div class="status-line"><span class="status-dot"></span> Entorno local activo</div><small>Rusted Mod Studio · v1.0</small></div>
      </aside>
      <main class="main">
        <header class="topbar"><div class="breadcrumb">MOD STUDIO <span>/</span> ${esc(tabTitle(activeTab).toUpperCase())}</div><div class="top-actions"><span id="save-state">Guardado local</span><button class="icon-btn" id="backup-btn" title="Exportar copia JSON">↓</button><div class="avatar">RM</div></div></header>
        <section class="content">${pageContent()}</section>
      </main>
    </div>`
  document.querySelectorAll('[data-tab]').forEach(el => el.addEventListener('click', () => setTab(el.dataset.tab)))
  document.querySelector('#backup-btn')?.addEventListener('click', exportJSON)
  bindPage()
}
function navItem(id, icon, label, count) {
  return `<button class="nav-item ${activeTab===id?'active':''}" data-tab="${id}"><span class="nav-icon">${icon}</span><span>${label}</span>${count!==undefined?`<em>${count}</em>`:''}</button>`
}
function tabTitle(tab) {
  return ({dashboard:'Resumen',project:'Proyecto',units:'Unidades',buildings:'Edificios',factions:'Facciones',economy:'Economía',validator:'Validador',export:'Exportar'})[tab] || 'Resumen'
}
function pageContent() {
  if (activeTab === 'dashboard') return dashboardPage()
  if (activeTab === 'project') return projectPage()
  if (['units','buildings','factions'].includes(activeTab)) return collectionPage(activeTab)
  if (activeTab === 'economy') return economyPage()
  if (activeTab === 'validator') return validatorPage()
  if (activeTab === 'export') return exportPage()
  return dashboardPage()
}
function dashboardPage() {
  const issues = validate()
  return `<div class="page-heading"><div><div class="eyebrow">PANEL PRINCIPAL</div><h1>Resumen del proyecto</h1><p>Administra los componentes de tu mod desde un solo espacio.</p></div><button class="primary-btn" data-tab="project">＋ Configurar proyecto</button></div>
  <div class="hero-card"><div><span class="hero-kicker">PROYECTO EN CURSO</span><h2>${esc(project.meta.name)}</h2><p>${esc(project.meta.description || 'Añade una descripción en la configuración del proyecto.')}</p><div class="hero-meta"><span>Versión ${esc(project.meta.version)}</span><span>Autor: ${esc(project.meta.author)}</span></div></div><div class="hero-emblem">RM<span>STUDIO</span></div></div>
  <div class="stats-grid">
    ${statCard('Unidades',project.units.length,'◈','blue','Elementos de combate y apoyo')}
    ${statCard('Edificios',project.buildings.length,'▥','green','Estructuras disponibles')}
    ${statCard('Facciones',project.factions.length,'⬡','purple','Grupos configurados')}
    ${statCard('Incidencias',issues.length,'✓',issues.length?'orange':'green',issues.length?'Requieren revisión':'Sin incidencias detectadas')}
  </div>
  <div class="dashboard-grid"><div class="panel"><div class="panel-head"><div><h3>Accesos rápidos</h3><p>Continúa diseñando tu contenido.</p></div></div><div class="quick-grid">
    ${quickCard('◈','Crear unidad','Define estadísticas y coste.','units')}
    ${quickCard('▥','Crear edificio','Configura estructura y producción.','buildings')}
    ${quickCard('⬡','Editar facciones','Diferencia sus características.','factions')}
    ${quickCard('✓','Validar proyecto','Busca problemas y referencias.','validator')}
  </div></div><div class="panel"><div class="panel-head"><div><h3>Estado del proyecto</h3><p>Resumen de configuración.</p></div><span class="tag">LOCAL</span></div><div class="progress-row"><span>Unidades</span><b>${project.units.length}</b></div><div class="mini-track"><i style="width:${Math.min(100,project.units.length*10)}%"></i></div><div class="progress-row"><span>Edificios</span><b>${project.buildings.length}</b></div><div class="mini-track green"><i style="width:${Math.min(100,project.buildings.length*10)}%"></i></div><div class="progress-row"><span>Facciones</span><b>${project.factions.length}</b></div><div class="mini-track purple"><i style="width:${Math.min(100,project.factions.length*25)}%"></i></div><button class="text-btn" data-tab="validator">Abrir informe de validación →</button></div></div>`
}
function statCard(title,value,icon,color,caption) { return `<div class="stat-card"><div class="stat-top"><span>${title}</span><i class="${color}">${icon}</i></div><strong>${value}</strong><small>${caption}</small></div>` }
function quickCard(icon,title,desc,tab) { return `<button class="quick-card" data-tab="${tab}"><span>${icon}</span><div><b>${title}</b><small>${desc}</small></div><i>↗</i></button>` }
function projectPage() {
 return `<div class="page-heading"><div><div class="eyebrow">CONFIGURACIÓN</div><h1>Proyecto</h1><p>Identidad y metadatos generales del mod.</p></div><button class="primary-btn" id="save-project">Guardar cambios</button></div>
 <div class="form-layout"><div class="panel form-panel"><h3>Información general</h3><p class="muted">Estos datos se usan al organizar y exportar el proyecto.</p>
 <label>Nombre del mod<input id="meta-name" value="${esc(project.meta.name)}" maxlength="80"></label>
 <label>Identificador interno<input id="meta-id" value="${esc(project.meta.id)}" maxlength="48"><small>Usa letras minúsculas, números y guion bajo.</small></label>
 <div class="two-col"><label>Versión<input id="meta-version" value="${esc(project.meta.version)}"></label><label>Autor<input id="meta-author" value="${esc(project.meta.author)}"></label></div>
 <label>Descripción<textarea id="meta-description" rows="4">${esc(project.meta.description)}</textarea></label>
 </div><div class="panel side-info"><div class="info-icon">ⓘ</div><h3>Almacenamiento</h3><p>Los cambios se guardan automáticamente en este navegador. Exporta un archivo JSON para conservar una copia o trasladar el proyecto.</p><button class="secondary-btn" id="import-json">Importar proyecto JSON</button><input type="file" id="json-file" accept=".json,application/json" hidden></div></div>`
}
function collectionPage(type) {
 const labels = {units:['Unidades','Unidad','unidades'],buildings:['Edificios','Edificio','edificios'],factions:['Facciones','Facción','facciones']}
 const [title,singular] = labels[type]
 const rows = project[type]
 return `<div class="page-heading"><div><div class="eyebrow">DISEÑO DEL MOD</div><h1>${title}</h1><p>Administra y configura ${title.toLowerCase()} de tu proyecto.</p></div><button class="primary-btn" id="add-item">＋ Nueva ${singular.toLowerCase()}</button></div>
 <div class="panel table-panel"><div class="table-toolbar"><div><b>Catálogo de ${title.toLowerCase()}</b><small>${rows.length} elemento(s) registrados</small></div><input class="search-input" id="filter-items" placeholder="Buscar por nombre o ID…"></div>
 ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>Nombre / ID</th>${type==='factions'?'<th>Especialidad</th>':'<th>Facción</th><th>Tipo</th><th>Salud</th><th>Coste</th>'}<th></th></tr></thead><tbody id="items-body">${rows.map(x=>itemRow(type,x)).join('')}</tbody></table></div>` : `<div class="empty-state"><span>＋</span><b>Aún no hay ${title.toLowerCase()}</b><p>Crea el primer elemento para comenzar a construir tu mod.</p></div>`}</div>
 ${editingId!==null?itemModal(type):''}`
}
function itemRow(type,x) {
 const faction = project.factions.find(f=>f.id===x.faction)
 return `<tr data-search="${esc((x.name+' '+x.id).toLowerCase())}"><td><div class="item-name">${type==='factions'?`<i style="background:${esc(x.color)}"></i>`:''}<b>${esc(x.name)}</b><small>${esc(x.id)}</small></div></td>${type==='factions'?`<td>${esc(x.strengths||'Sin especialidad')}</td>`:`<td>${esc(faction?.name||'Sin asignar')}</td><td>${esc(x.category||'General')}</td><td>${fmt(x.hp)}</td><td>${fmt(x.cost)}</td>`}<td class="row-actions"><button data-edit="${esc(x.id)}" title="Editar">✎</button><button data-delete="${esc(x.id)}" title="Eliminar">×</button></td></tr>`
}
function itemModal(type) {
 const existing = project[type].find(x=>x.id===editingId)
 const x = existing || (type==='factions'?{id:'',name:'',color:'#4f9bff',description:'',startingCredits:1000,income:5,buildSpeed:1,strengths:'',weaknesses:''}:{id:'',name:'',faction:project.factions[0]?.id||'',category:type==='units'?'Infantería':'Servicio',hp:300,cost:200,buildTime:10,income:0,description:''})
 const isFaction = type==='factions'
 return `<div class="modal-backdrop" id="modal-backdrop"><div class="modal"><div class="modal-head"><div><div class="eyebrow">${existing?'EDITAR':'CREAR'} ELEMENTO</div><h2>${existing?'Editar':'Nueva'} ${isFaction?'facción':type==='units'?'unidad':'edificio'}</h2></div><button class="close-btn" id="close-modal">×</button></div>
 <form id="item-form"><div class="form-scroll">
 <div class="two-col"><label>Nombre<input name="name" required maxlength="70" value="${esc(x.name)}"></label><label>ID interno<input name="id" required pattern="[a-zA-Z0-9_]+" maxlength="48" value="${esc(x.id)}"><small>Sin espacios ni caracteres especiales.</small></label></div>
 ${isFaction?`<div class="two-col"><label>Color identificador<input type="color" name="color" value="${esc(x.color)}"></label><label>Créditos iniciales<input type="number" min="0" name="startingCredits" value="${x.startingCredits}"></label></div>
 <div class="two-col"><label>Ingresos base<input type="number" min="0" step="0.1" name="income" value="${x.income}"></label><label>Velocidad de construcción<input type="number" min="0.1" step="0.1" name="buildSpeed" value="${x.buildSpeed}"></label></div>
 <label>Ventajas<input name="strengths" value="${esc(x.strengths)}"></label><label>Desventajas<input name="weaknesses" value="${esc(x.weaknesses)}"></label>`:
 `<div class="two-col"><label>Facción<select name="faction">${project.factions.map(f=>`<option value="${esc(f.id)}" ${x.faction===f.id?'selected':''}>${esc(f.name)}</option>`).join('')}</select></label><label>Categoría<input name="category" value="${esc(x.category)}"></label></div>
 <div class="three-col"><label>Salud máxima<input type="number" min="1" name="hp" value="${x.hp}"></label><label>Coste<input type="number" min="0" name="cost" value="${x.cost}"></label><label>Tiempo de construcción<input type="number" min="0" step="0.1" name="buildTime" value="${x.buildTime}"></label></div>
 ${type==='buildings'?`<label>Ingresos generados<input type="number" min="0" step="0.1" name="income" value="${x.income||0}"></label>`:''}`}
 <label>Descripción<textarea name="description" rows="3">${esc(x.description||'')}</textarea></label>
 </div><div class="modal-foot"><button type="button" class="secondary-btn" id="cancel-modal">Cancelar</button><button class="primary-btn" type="submit">Guardar elemento</button></div></form></div></div>`
}
function economyPage() {
 return `<div class="page-heading"><div><div class="eyebrow">BALANCE DEL JUEGO</div><h1>Economía por facción</h1><p>Compara y ajusta los parámetros económicos iniciales.</p></div><button class="primary-btn" id="save-economy">Guardar economía</button></div>
 <div class="economy-grid">${project.factions.map(f=>`<div class="panel economy-card"><div class="faction-title"><i style="background:${esc(f.color)}"></i><div><h3>${esc(f.name)}</h3><small>${esc(f.id)}</small></div></div><label>Créditos iniciales<input type="number" min="0" data-econ="${esc(f.id)}" data-field="startingCredits" value="${f.startingCredits}"></label><label>Ingresos base<input type="number" min="0" step="0.1" data-econ="${esc(f.id)}" data-field="income" value="${f.income}"></label><label>Multiplicador de construcción<input type="number" min="0.1" step="0.1" data-econ="${esc(f.id)}" data-field="buildSpeed" value="${f.buildSpeed}"></label><div class="faction-notes"><span>VENTAJA</span><p>${esc(f.strengths||'No definida')}</p><span>DESVENTAJA</span><p>${esc(f.weaknesses||'No definida')}</p></div></div>`).join('') || `<div class="panel empty-state">Crea al menos una facción para configurar la economía.</div>`}</div>
 <div class="notice"><b>Nota de balance:</b> estos valores son parámetros de diseño del proyecto. El editor no simula partidas ni determina por sí solo el equilibrio real; prueba los cambios dentro del juego.</div>`
}
function validate() {
 const issues = []
 const collections = [['facciones',project.factions],['unidades',project.units],['edificios',project.buildings]]
 const seen = new Map()
 for (const [label,list] of collections) for (const item of list) {
   if (!item.id) issues.push({level:'error',where:label,item:item.name||'(sin nombre)',message:'Falta el identificador interno.'})
   const key = item.id.toLowerCase()
   if (seen.has(key)) issues.push({level:'error',where:label,item:item.name||item.id,message:`ID duplicado: también aparece en ${seen.get(key)}.`})
   else seen.set(key,label)
   if (!item.name?.trim()) issues.push({level:'error',where:label,item:item.id||'(sin ID)',message:'Falta el nombre visible.'})
 }
 for (const item of [...project.units,...project.buildings]) {
   if (!project.factions.some(f=>f.id===item.faction)) issues.push({level:'error',where:'referencias',item:item.name||item.id,message:`La facción "${item.faction||'vacía'}" no existe.`})
   if (Number(item.hp)<=0) issues.push({level:'error',where:'estadísticas',item:item.name||item.id,message:'La salud debe ser mayor que cero.'})
   if (Number(item.cost)<0) issues.push({level:'error',where:'economía',item:item.name||item.id,message:'El coste no puede ser negativo.'})
 }
 if (!project.meta.name?.trim()) issues.push({level:'error',where:'proyecto',item:'Metadatos',message:'El proyecto no tiene nombre.'})
 if (!project.meta.id || !/^[a-z0-9_]+$/i.test(project.meta.id)) issues.push({level:'error',where:'proyecto',item:'Metadatos',message:'El ID del mod debe contener solo letras, números y guion bajo.'})
 if (!project.units.length) issues.push({level:'warning',where:'contenido',item:'Unidades',message:'El proyecto todavía no contiene unidades.'})
 if (!project.buildings.length) issues.push({level:'warning',where:'contenido',item:'Edificios',message:'El proyecto todavía no contiene edificios.'})
 if (!project.factions.length) issues.push({level:'warning',where:'contenido',item:'Facciones',message:'El proyecto todavía no contiene facciones.'})
 return issues
}
function validatorPage() {
 const issues = validate(), errors=issues.filter(x=>x.level==='error').length, warnings=issues.filter(x=>x.level==='warning').length
 return `<div class="page-heading"><div><div class="eyebrow">CONTROL DE CALIDAD</div><h1>Validador del proyecto</h1><p>Comprueba integridad básica, campos y referencias internas.</p></div><button class="secondary-btn" id="refresh-validation">↻ Ejecutar de nuevo</button></div>
 <div class="validation-summary"><div><strong>${errors}</strong><span>Errores</span></div><div><strong>${warnings}</strong><span>Advertencias</span></div><div><strong>${issues.length===0?'OK':'REVISAR'}</strong><span>Estado del proyecto</span></div></div>
 <div class="panel"><div class="panel-head"><div><h3>Resultados</h3><p>${issues.length?`Se encontraron ${issues.length} observaciones.`:'No se detectaron problemas en las comprobaciones disponibles.'}</p></div></div>
 ${issues.length?`<div class="issue-list">${issues.map(i=>`<div class="issue"><span class="issue-badge ${i.level}">${i.level==='error'?'ERROR':'AVISO'}</span><div><b>${esc(i.item)}</b><p>${esc(i.message)}</p><small>${esc(i.where)}</small></div></div>`).join('')}</div>`:`<div class="success-state"><span>✓</span><b>Validación básica superada</b><p>Esto no garantiza compatibilidad completa con el motor del juego.</p></div>`}</div>
 <div class="notice"><b>Límite del validador:</b> revisa la estructura de datos de este editor. No interpreta todo el lenguaje de configuración del juego, no valida imágenes ni ejecuta el motor. La prueba final debe realizarse en Rusted Warfare.</div>`
}
function exportPage() {
 return `<div class="page-heading"><div><div class="eyebrow">COMPILACIÓN Y DISTRIBUCIÓN</div><h1>Exportar proyecto</h1><p>Genera una copia editable o prepara un paquete inicial para el juego.</p></div></div>
 <div class="export-grid"><div class="panel export-card"><div class="export-icon">{" "}</div><span class="eyebrow">FORMATO DE TRABAJO</span><h2>Proyecto JSON</h2><p>Guarda todos los datos del editor en un archivo que podrás volver a importar o compartir.</p><div class="export-detail"><span>Extensión</span><b>.json</b></div><button class="primary-btn full-btn" id="export-json">Exportar JSON ↓</button></div>
 <div class="panel export-card featured"><div class="export-icon">▣</div><span class="eyebrow">PAQUETE DEL MOD</span><h2>Paquete .rwmod</h2><p>Construye un archivo ZIP inicial con metadatos y plantillas INI generadas desde tus elementos.</p><div class="export-detail"><span>Extensión</span><b>.rwmod</b></div><button class="primary-btn full-btn" id="export-rwmod">Generar .rwmod ↓</button></div></div>
 <div class="notice"><b>Antes de distribuir:</b> el paquete generado es una estructura inicial. Revisa los archivos INI y recursos con ejemplos compatibles con tu versión de Rusted Warfare y prueba el paquete en el juego. No se incluye automáticamente arte, sonidos, mapas ni código específico que no hayas creado.</div>`
}
function bindPage() {
 document.querySelectorAll('[data-tab]').forEach(el => el.addEventListener('click',()=>setTab(el.dataset.tab)))
 document.querySelector('#save-project')?.addEventListener('click',()=>{
   project.meta.name=document.querySelector('#meta-name').value.trim()
   project.meta.id=document.querySelector('#meta-id').value.trim()
   project.meta.version=document.querySelector('#meta-version').value.trim()
   project.meta.author=document.querySelector('#meta-author').value.trim()
   project.meta.description=document.querySelector('#meta-description').value.trim()
   saveProject(); render()
 })
 document.querySelector('#import-json')?.addEventListener('click',()=>document.querySelector('#json-file').click())
 document.querySelector('#json-file')?.addEventListener('change',importJSON)
 document.querySelector('#add-item')?.addEventListener('click',()=>{editingId=null;render()})
 document.querySelector('#close-modal')?.addEventListener('click',()=>render())
 document.querySelector('#cancel-modal')?.addEventListener('click',()=>render())
 document.querySelector('#modal-backdrop')?.addEventListener('click',e=>{if(e.target.id==='modal-backdrop')render()})
 document.querySelector('#item-form')?.addEventListener('submit',saveItem)
 document.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>{editingId=b.dataset.edit;render()}))
 document.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>deleteItem(b.dataset.delete)))
 document.querySelector('#filter-items')?.addEventListener('input',e=>document.querySelectorAll('#items-body tr').forEach(row=>row.hidden=!row.dataset.search.includes(e.target.value.toLowerCase())))
 document.querySelector('#save-economy')?.addEventListener('click',()=>{
   document.querySelectorAll('[data-econ]').forEach(input=>{const f=project.factions.find(x=>x.id===input.dataset.econ);if(f)f[input.dataset.field]=Number(input.value)})
   saveProject();render()
 })
 document.querySelector('#refresh-validation')?.addEventListener('click',render)
 document.querySelector('#export-json')?.addEventListener('click',exportJSON)
 document.querySelector('#export-rwmod')?.addEventListener('click',exportRwmod)
}
function saveItem(e) {
 e.preventDefault()
 const form=new FormData(e.currentTarget), data=Object.fromEntries(form.entries())
 const type=activeTab
 if(type!=='factions') for(const key of ['hp','cost','buildTime','income']) if(data[key]!==undefined)data[key]=Number(data[key])
 if(type==='factions') for(const key of ['startingCredits','income','buildSpeed']) data[key]=Number(data[key])
 data.id=slug(data.id)
 const duplicate=project[type].some(x=>x.id===data.id&&x.id!==editingId)
 if(duplicate){alert('Ya existe un elemento con ese ID en esta categoría.');return}
 if(editingId!==null) {
   const index=project[type].findIndex(x=>x.id===editingId)
   if(index>=0)project[type][index]=data
 } else project[type].push(data)
 saveProject();editingId=null;render()
}
function deleteItem(id) {
 if(!confirm('¿Eliminar este elemento? Esta acción no se puede deshacer.'))return
 project[activeTab]=project[activeTab].filter(x=>x.id!==id)
 saveProject();render()
}
function downloadBlob(blob,name) {
 const url=URL.createObjectURL(blob), a=document.createElement('a')
 a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
function exportJSON() {
 const blob=new Blob([JSON.stringify(project,null,2)],{type:'application/json'})
 downloadBlob(blob,`${slug(project.meta.id)||'proyecto'}-project.json`)
}
async function importJSON(e) {
 const file=e.target.files?.[0];if(!file)return
 try {
   const parsed=JSON.parse(await file.text())
   if(!parsed.meta||!Array.isArray(parsed.units)||!Array.isArray(parsed.buildings)||!Array.isArray(parsed.factions))throw new Error('Formato de proyecto no reconocido.')
   project=parsed;saveProject();render()
 } catch(err){alert(`No se pudo importar: ${err.message}`)}
 e.target.value=''
}
function makeIni(item,type) {
 const lines=[
   `# Plantilla generada por Rusted Mod Studio.`,
   `# Revisa las propiedades y la sintaxis contra la documentación de tu versión de Rusted Warfare.`,
   `[core]`,
   `name: ${item.id}`,
   `displayText: ${item.name}`,
   `displayDescription: ${String(item.description||'').replace(/\n/g,' ')}`,
   `price: ${Number(item.cost||0)}`,
   `maxHp: ${Number(item.hp||1)}`,
   `mass: 1`,
   `techLevel: 1`,
 ]
 if(type==='buildings') lines.push(`isBuilding: true`)
 lines.push('',`# Categoría del editor: ${item.category||'General'}`,`# Facción del editor: ${item.faction||'sin_asignar'}`)
 return lines.join('\n')
}
async function exportRwmod() {
 const zip=new JSZip()
 zip.file('mod-info.txt',`[mod]\ntitle: ${project.meta.name}\ndescription: ${project.meta.description}\n`)
 const units=zip.folder('units')
 for(const u of project.units)units.file(`${u.id}.ini`,makeIni(u,'units'))
 for(const b of project.buildings)units.file(`${b.id}.ini`,makeIni(b,'buildings'))
 zip.file('rusted-mod-studio/project.json',JSON.stringify(project,null,2))
 zip.file('rusted-mod-studio/README.txt','Paquete inicial generado por Rusted Mod Studio. Revisa los INI y confirma compatibilidad con tu versión del juego antes de usar o distribuir.')
 const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}})
 downloadBlob(blob,`${slug(project.meta.id)||'mod'}.rwmod`)
}
render()
