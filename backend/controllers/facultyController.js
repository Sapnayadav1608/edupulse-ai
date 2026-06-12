const User = require('../models/User');

// GET /api/faculty
const getFaculty = async (req, res, next) => {
  try {
    const { search } = req.query;
    let faculty = await User.find({ role: 'faculty' })
      .select('-password')
      .sort({ createdAt: -1 });

    if (search) {
      const s = search.toLowerCase();
      faculty = faculty.filter(f =>
        f.name.toLowerCase().includes(s) || f.email.toLowerCase().includes(s)
      );
    }

    res.json({ success: true, count: faculty.length, faculty });
  } catch (error) { next(error); }
};

// GET /api/faculty/:id
const getFacultyById = async (req, res, next) => {
  try {
    const faculty = await User.findOne({ _id: req.params.id, role: 'faculty' }).select('-password');
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });
    res.json({ success: true, faculty });
  } catch (error) { next(error); }
};

// POST /api/faculty
const createFaculty = async (req, res, next) => {
  try {
    const { name, email, password, department, designation, phone } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const faculty = await User.create({
      name, email,
      password: password || 'faculty123',
      role: 'faculty',
      department, designation, phone,
    });

    const result = faculty.toObject();
    delete result.password;
    res.status(201).json({ success: true, faculty: result });
  } catch (error) { next(error); }
};

// PUT /api/faculty/:id
const updateFaculty = async (req, res, next) => {
  try {
    const { name, email, department, designation, phone, isActive } = req.body;

    const faculty = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'faculty' },
      { name, email, department, designation, phone, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });
    res.json({ success: true, faculty });
  } catch (error) { next(error); }
};

// DELETE /api/faculty/:id
const deleteFaculty = async (req, res, next) => {
  try {
    const faculty = await User.findOneAndDelete({ _id: req.params.id, role: 'faculty' });
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });
    res.json({ success: true, message: 'Faculty deleted successfully' });
  } catch (error) { next(error); }
};

// GET /api/faculty/me
const getMyProfile = async (req, res, next) => {
  try {
    const faculty = await User.findById(req.user._id).select('-password');
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });
    res.json({ success: true, faculty });
  } catch (error) { next(error); }
};

// PATCH /api/faculty/me
const updateMyProfile = async (req, res, next) => {
  try {
    const { name, phone, department, designation } = req.body;
    const faculty = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, department, designation },
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ success: true, faculty });
  } catch (error) { next(error); }
};

module.exports = { getFaculty, getFacultyById, createFaculty, updateFaculty, deleteFaculty, getMyProfile, updateMyProfile };
