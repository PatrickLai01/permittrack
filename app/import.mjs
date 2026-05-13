import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parse/sync';

const supabase = createClient(
  'https://dmataerylfryldrpuicg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYXRhZXJ5bGZyeWxkcnB1aWNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY5NDc1MiwiZXhwIjoyMDk0MjcwNzUyfQ.f6sVRoxVHGNclikZ-siybcgDp6HWlCUHrC4ZX-hdofo'
);

async function importPermits() {
  const csvData = fs.readFileSync('C:\\Users\\kenml\\permittrack\\permittrack_all_permits.csv', 'utf-8');
  const records = csv.parse(csvData, { columns: true });

  const { data: cities } = await supabase.from('cities').select('id, name');
  const cityMap = Object.fromEntries(cities.map(c => [c.name, c.id]));

  let inserted = 0;
  let skipped = 0;

  for (const record of records) {
    const cityId = cityMap[record.city];
    if (!cityId) {
      skipped++;
      continue;
    }

    await supabase.from('permits').insert({
      permit_number: record.permit_number,
      city_id: cityId,
      source: 'csv_manual',
      permit_type: record.permit_type,
      description: record.description,
      status: record.status,
      issued_date: record.issued_date || null,
      address: record.address,
      contractor_name: record.contractor_name,
    }).catch(e => console.error('Insert error:', e));

    inserted++;
    if (inserted % 100 === 0) console.log(`Imported ${inserted}...`);
  }

  console.log(`\n✓ Done! Imported ${inserted} permits, skipped ${skipped}`);
  process.exit(0);
}

importPermits();