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

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('--- Checking Supabase Cloud Database ---');
  console.log('Project URL:', supabaseUrl);

  const { data: students, count: sCount, error: sErr } = await supabase
    .from('Student')
    .select('admissionNumber, studentName, class, section, dob', { count: 'exact' });

  if (sErr) {
    console.log('Error querying Student table:', sErr.message, sErr.code);
  } else {
    console.log(`Total students in Supabase: ${sCount}`);
    if (students && students.length > 0) {
      console.log('First 5 students in Supabase:', students.slice(0, 5));
    }
  }

  const { count: cCount, error: cErr } = await supabase
    .from('HealthCheckup')
    .select('*', { count: 'exact', head: true });
  console.log(`Total HealthCheckups in Supabase: ${cCount ?? 0} (Error: ${cErr?.message || 'none'})`);

  const { data: doctors, count: dCount, error: dErr } = await supabase
    .from('Doctor')
    .select('username, name, role', { count: 'exact' });
  console.log(`Total Doctors in Supabase: ${dCount ?? 0} (Error: ${dErr?.message || 'none'})`);
  if (doctors) {
    console.log('Doctors in Supabase:', doctors);
  }
}

check().catch(console.error);
