const User = require('../models/User');
const Student = require('../models/Student');

// @route  GET /api/students
// @access Admin, Faculty
const getStudents = async (req, res, next) => {
  try {
    const { search, department, semester } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester)   filter.semester = Number(semester);

    let students = await Student.find(filter)
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 });

    // Search by name or roll number
    if (search) {
      const s = search.toLowerCase();
      students = students.filter(st =>
        st.user.name.toLowerCase().includes(s) ||
        st.rollNumber.toLowerCase().includes(s)
      );
    }

    res.json({ success: true, count: students.length, students });
  } catch (error) { next(error); }
};

// @route  GET /api/students/:id
const getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate('user', 'name email avatar');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, student });
  } catch (error) { next(error); }
};

// @route  POST /api/students
// @access Admin only
const createStudent = async (req, res, next) => {
  try {
    const { name, email, password, rollNumber, department, semester, batch, phone, cgpa } = req.body;

    // Check duplicate email or roll number
    const emailExists = await User.findOne({ email });
    if (emailExists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const rollExists = await Student.findOne({ rollNumber });
    if (rollExists) return res.status(400).json({ success: false, message: 'Roll number already exists' });

    // Create user account for student
    const user = await User.create({ name, email, password: password || 'student123', role: 'student' });

    // Create student profile linked to user
    const student = await Student.create({
      user: user._id, rollNumber, department, semester, batch, phone, cgpa: cgpa || 0,
    });

    const populated = await student.populate('user', 'name email');
    res.status(201).json({ success: true, student: populated });
  } catch (error) { next(error); }
};

// @route  PUT /api/students/:id
const updateStudent = async (req, res, next) => {
  try {
    const { name, email, rollNumber, department, semester, batch, phone, cgpa, placementStatus } = req.body;

    const student = await Student.findById(req.params.id).populate('user');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Update user name/email
    if (name || email) {
      await User.findByIdAndUpdate(student.user._id, {
        ...(name && { name }),
        ...(email && { email }),
      });
    }

    // Update student profile fields
    const updated = await Student.findByIdAndUpdate(
      req.params.id,
      { rollNumber, department, semester, batch, phone, cgpa, placementStatus },
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    res.json({ success: true, student: updated });
  } catch (error) { next(error); }
};

// @route  DELETE /api/students/:id
// @access Admin only
const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Delete both student profile and user account
    await User.findByIdAndDelete(student.user);
    await Student.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) { next(error); }
};

// @route  GET /api/students/me  (student sees own profile)
const getMyProfile = async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id }).populate('user', 'name email');
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
    res.json({ success: true, student });
  } catch (error) { next(error); }
};

// @route  PATCH /api/students/me/profile  (student updates own name/phone)
const updateMyProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
    if (name) await User.findByIdAndUpdate(req.user._id, { name });
    if (phone !== undefined) student.phone = phone;
    await student.save();
    const updated = await Student.findOne({ user: req.user._id }).populate('user', 'name email');
    res.json({ success: true, student: updated });
  } catch (error) { next(error); }
};

// @route  PATCH /api/students/me/interests
const updateInterests = async (req, res, next) => {
  try {
    const { interests } = req.body;
    const student = await Student.findOneAndUpdate(
      { user: req.user._id },
      { interests },
      { new: true }
    ).populate('user', 'name email');
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });
    res.json({ success: true, student });
  } catch (error) { next(error); }
};

module.exports = { getStudents, getStudent, createStudent, updateStudent, deleteStudent, getMyProfile, updateMyProfile, updateInterests };
