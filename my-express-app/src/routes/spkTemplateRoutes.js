// src/routes/spkTemplateRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllTemplates,
  createTemplate,
  getTemplateDetail,
  saveTemplateContent,
  deleteTemplate
} = require('../controllers/spkTemplateController'); 

// Routes
router.get('/', getAllTemplates);
router.post('/', createTemplate);
router.get('/:id', getTemplateDetail);
router.put('/:id', saveTemplateContent);
router.delete('/:id', deleteTemplate);

module.exports = router;