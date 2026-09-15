const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
for (const line of envLocal.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) envVars[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
}

const supabase = createClient(envVars['NEXT_PUBLIC_SUPABASE_URL'], envVars['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']);

async function testInsert() {
  const testStudent = {
    admissionNumber: 'TEST001',
    studentName: 'Test Student',
    class: 'I',
    section: 'A',
    gender: 'Male',
    dob: new Date('2015-01-01').toISOString(),
    bloodGroup: 'O+',
    parentName: 'Parent Test',
    phone: '+91 9999999999'
  };
  const { data, error } = await supabase.from('Student').insert([testStudent]).select();
  console.log('Insert result:', JSON.stringify({ data, error }, null, 2));
}

testInsert().catch(console.error);
