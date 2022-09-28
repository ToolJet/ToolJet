const { PostgrestClient } = require('@supabase/postgrest-js');

const pg = new PostgrestClient(process.env.TOOLJET_STORAGE_URL, {
  headers: {
    Authorization: `Bearer ${process.env.TOOLJET_STORAGE_TOKEN}`,
  },
});

export default pg;
