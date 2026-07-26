const Experience = require('../models/Experience');

exports.getExperiences = async (req, res) => {
  try {
    const experiences = await Experience.find().sort({ startDate: -1, order: 1 });
    res.status(200).json({ success: true, experiences });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createExperience = async (req, res) => {
  try {
    const experience = await Experience.create(req.body);
    res.status(201).json({ success: true, experience });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateExperience = async (req, res) => {
  try {
    const experience = await Experience.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!experience) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, experience });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteExperience = async (req, res) => {
  try {
    await Experience.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};