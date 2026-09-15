const fs = require('fs');
const path = require('path');

const fullSql = fs.readFileSync(path.join('supabase', 'complete_supabase_setup.sql'), 'utf8');

const splitPoint = fullSql.indexOf('-- 5. DATA POPULATION');
if (splitPoint !== -1) {
  const schemaSql = fullSql.substring(0, splitPoint);
  const dataSql = fullSql.substring(splitPoint);

  fs.writeFileSync(path.join('supabase', '01_schema.sql'), schemaSql, 'utf8');
  fs.writeFileSync(path.join('supabase', '02_data.sql'), dataSql, 'utf8');
  console.log('Created supabase/01_schema.sql and supabase/02_data.sql');
}
