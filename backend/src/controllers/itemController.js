const supabase = require('../config/supabaseClient');

// Logika untuk /api/halo
const getHalo = (req, res) => {
  res.json({ message: "Halo dari server Express!" });
};

// Logika untuk /api/items
const getItems = async (req, res) => {
  try {
    const { data, error } = await supabase.from('items').select('*');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getHalo,
  getItems,
};