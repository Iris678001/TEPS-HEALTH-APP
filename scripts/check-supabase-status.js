const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envLocal = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const envVars = {};
for (const line of envLocal.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    envVars[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
  }
}

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];

console.log('Testing Supabase project endpoint:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const tables = ['Student', 'HealthCheckup', 'Observation', 'Immunization', 'Doctor'];
  for (const table of tables) {
    const { data, error, count } = await supabase.from(table).select('id, admissionNumber, username', { count: 'exact' }).limit(1);
    if (error) {
      console.log(`[x] Table "${table}": NOT READY in Supabase -> ${error.message} (${error.code})`);
    } else {
      console.log(`[v] Table "${table}": READY in Supabase -> Total Records: ${count ?? 0}`);
    }
  }
}

check().catch(console.error);
