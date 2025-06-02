const { Admin } = require('../models');
const { formatResponse, formatError } = require('../utils');

/**
 * Get all admins
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.findAll({
            attributes: { exclude: ['password'] }
        });
        
        return res.json(formatResponse(admins));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Get admin by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAdminById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const admin = await Admin.findByPk(id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!admin) {
            return res.status(404).json(formatError(null, 'Admin not found', 404));
        }
        
        return res.json(formatResponse(admin));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Create new admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createAdmin = async (req, res) => {
    try {
        const { username, password, name, role, email } = req.body;
        
        // Check if username already exists
        const existingAdmin = await Admin.findOne({ where: { username } });
        if (existingAdmin) {
            return res.status(400).json(formatError(null, 'Username already exists', 400));
        }
        
        // Check if email already exists
        const existingEmail = await Admin.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(400).json(formatError(null, 'Email already exists', 400));
        }
        
        // Create new admin
        const admin = await Admin.create({
            username,
            password,
            name,
            role,
            email,
            status: 'active'
        });
        
        return res.status(201).json(formatResponse({
            id: admin.id,
            username: admin.username,
            name: admin.name,
            role: admin.role,
            email: admin.email,
            status: admin.status
        }, 'Admin created successfully'));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Update admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, email, status, password } = req.body;
        
        // Find admin
        const admin = await Admin.findByPk(id);
        if (!admin) {
            return res.status(404).json(formatError(null, 'Admin not found', 404));
        }
        
        // Check if email already exists (if email is being updated)
        if (email && email !== admin.email) {
            const existingEmail = await Admin.findOne({ where: { email } });
            if (existingEmail) {
                return res.status(400).json(formatError(null, 'Email already exists', 400));
            }
        }
        
        // Update admin
        const updateData = {};
        if (name) updateData.name = name;
        if (role) updateData.role = role;
        if (email) updateData.email = email;
        if (status) updateData.status = status;
        if (password) updateData.password = password;
        
        await admin.update(updateData);
        
        return res.json(formatResponse({
            id: admin.id,
            username: admin.username,
            name: admin.name,
            role: admin.role,
            email: admin.email,
            status: admin.status
        }, 'Admin updated successfully'));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Delete admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find admin
        const admin = await Admin.findByPk(id);
        if (!admin) {
            return res.status(404).json(formatError(null, 'Admin not found', 404));
        }
        
        // Delete admin
        await admin.destroy();
        
        return res.json(formatResponse(null, 'Admin deleted successfully'));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

module.exports = {
    getAllAdmins,
    getAdminById,
    createAdmin,
    updateAdmin,
    deleteAdmin
};
