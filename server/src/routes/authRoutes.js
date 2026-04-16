const express = require('express');
const {
	loginUser,
	registerUser,
	getMyProfile,
	getProfileSummary,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMyProfile);
router.get('/profile-summary', protect, getProfileSummary);

module.exports = router;
