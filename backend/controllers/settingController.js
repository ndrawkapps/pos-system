const pool = require('../config/database');

exports.getAllSettings = async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT * FROM settings');

    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = setting.setting_value;
    });

    res.json({
      success: true,
      data: settingsObj
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key) {
      return res.status(400).json({ 
        success: false, 
        message: 'Setting key is required' 
      });
    }

    await pool.query(
      `INSERT INTO settings (setting_key, setting_value) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE setting_value = ?`,
      [key, value, value]
    );

    res.json({
      success: true,
      message: 'Setting updated successfully'
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
