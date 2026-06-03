const fs = require('fs');
const path = require('path');
const dir = './src/pages';
const files = ['Reservations.tsx', 'Rooms.tsx', 'Clients.tsx', 'Payments.tsx', 'Dashboard.tsx'];

files.forEach(f => {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');
  
  // Reservations / Payments / Dashboard
  content = content.replace(/className="btn-secondary"\s+style=\{\{\s*padding:\s*'0.25rem 0.5rem',\s*fontSize:\s*'0.875rem',\s*display:\s*'flex',\s*alignItems:\s*'center'(,\s*gap:\s*'4px')?\s*\}\}/g, 'className="btn-action"');
  
  // Danger button (Cancelar)
  content = content.replace(/className="btn-secondary"\s+style=\{\{\s*padding:\s*'0.25rem 0.5rem',\s*fontSize:\s*'0.875rem',\s*display:\s*'flex',\s*alignItems:\s*'center',\s*color:\s*'var\(--status-error\)'\s*\}\}/g, 'className="btn-action danger"');

  // Rooms / Clients style 
  content = content.replace(/style=\{\{\s*background:\s*'none',\s*border:\s*'none',\s*cursor:\s*'pointer',\s*color:\s*'var\(--text-secondary\)'\s*\}\}/g, 'className="btn-action"');
  
  // Rooms / Clients danger style
  content = content.replace(/style=\{\{\s*background:\s*'none',\s*border:\s*'none',\s*cursor:\s*'pointer',\s*color:\s*'var\(--status-error\)'\s*\}\}/g, 'className="btn-action danger"');

  fs.writeFileSync(p, content);
});

console.log('Done!');
