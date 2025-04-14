// Script to automate schema changes with Prisma and Supabase
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command) {
  console.log(`Running: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.stdout || error.message);
    process.exit(1);
  }
}

function applySchemaChange() {
  const migrationName = process.argv[2];
  
  if (!migrationName) {
    console.error('Please provide a migration name as an argument');
    console.error('Usage: node apply-schema-change.js add_new_feature');
    process.exit(1);
  }
  
  // 1. Push schema changes directly to database
  console.log('🔄 Pushing schema changes to database...');
  runCommand('npx prisma db push');
  
  // 2. Create a timestamped migration folder
  const timestamp = new Date().toISOString()
    .replace(/[-T:.Z]/g, '')
    .substring(0, 14);
  const fullMigrationName = `${timestamp}_${migrationName}`;
  const migrationDir = path.join('prisma', 'migrations', fullMigrationName);
  
  console.log(`📁 Creating migration directory: ${migrationDir}`);
  fs.mkdirSync(migrationDir, { recursive: true });
  
  // 3. Generate SQL diff between current schema and empty schema
  console.log('🔍 Generating SQL diff...');
  let sql = '';
  try {
    sql = runCommand('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script');
  } catch (error) {
    // If diff command fails, create a simpler migration file
    sql = '-- Migration created manually after schema changes\n\n-- No SQL generated automatically';
  }
  
  // 4. Add safety modifiers to make migration more resilient
  sql = sql
    .replace(/CREATE TABLE /g, 'CREATE TABLE IF NOT EXISTS ')
    .replace(/CREATE TYPE /g, 'CREATE TYPE IF NOT EXISTS ')
    .replace(/ALTER TABLE (\w+) ADD CONSTRAINT/g, 'ALTER TABLE IF EXISTS $1 ADD CONSTRAINT IF NOT EXISTS');
  
  // 5. Write migration file
  const migrationFile = path.join(migrationDir, 'migration.sql');
  console.log(`📝 Writing migration file: ${migrationFile}`);
  fs.writeFileSync(migrationFile, sql);
  
  // 6. Mark migration as applied
  console.log('✅ Marking migration as applied...');
  runCommand(`npx prisma migrate resolve --applied ${fullMigrationName}`);
  
  // 7. Generate fresh Prisma client
  console.log('🔄 Generating Prisma client...');
  runCommand('npx prisma generate');
  
  console.log(`\n✨ Schema change "${migrationName}" applied successfully!`);
  console.log('📋 Next time you want to make a schema change:');
  console.log('1. Edit your schema.prisma file');
  console.log('2. Run: node prisma/apply-schema-change.js your_change_name');
}

applySchemaChange(); 