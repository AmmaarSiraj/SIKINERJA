const express = require('express');
const router = express.Router();
const mitraController = require('../controllers/mitraController');
const authenticateToken = require('../midleware/authMiddleware');

router.use(authenticateToken);

router.post('/', mitraController.createMitra);
router.get('/', mitraController.getAllMitra);
router.get('/user/:id_user', mitraController.getMitraByUserId);
router.get('/:id', mitraController.getMitraById);
router.put('/:id', mitraController.updateMitra);
router.delete('/:id', mitraController.deleteMitra);

module.exports = router;