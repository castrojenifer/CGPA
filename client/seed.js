import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ylzylmmseqgmxriqjcwa.supabase.co';
const supabaseKey = 'sb_publishable_yCTvE789OvQwqoyu__3wAg_Lk0aw07B';
const supabase = createClient(supabaseUrl, supabaseKey);

const departments = [
  'Computer Science & Engineering',
  'Information Technology',
  'Artificial Intelligence & Data Science',
  'Electronics & Communication Engineering',
  'Electrical & Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Biotechnology',
  'Chemical Engineering'
];

async function seed() {
  console.log('Seeding departments...');
  for (const name of departments) {
    const { data, error } = await supabase
      .from('departments')
      .upsert({ name }, { onConflict: 'name' })
      .select();
    
    if (error) {
      console.error(`Error seeding ${name}:`, error.message);
    } else {
      console.log(`Success: ${name}`);
    }
  }
  console.log('Finished seeding.');
}

seed();
