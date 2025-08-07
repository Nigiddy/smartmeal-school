const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

class MenuController {
  /**
   * Get all menu items with optional filtering
   */
  async getMenuItems(req, res) {
    try {
      const { 
        category, 
        available, 
        search, 
        page = 1, 
        limit = 20 
      } = req.query;

      const skip = (page - 1) * limit;
      const where = {};

      // Apply filters
      if (category) where.category = category;
      if (available !== undefined) where.isAvailable = available === 'true';
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [menuItems, total] = await Promise.all([
        prisma.menuItem.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: parseInt(skip),
          take: parseInt(limit)
        }),
        prisma.menuItem.count({ where })
      ]);

      res.json({
        success: true,
        data: menuItems,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get menu items error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch menu items'
      });
    }
  }

  /**
   * Get menu item by ID
   */
  async getMenuItemById(req, res) {
    try {
      const { id } = req.params;

      const menuItem = await prisma.menuItem.findUnique({
        where: { id }
      });

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found'
        });
      }

      res.json({
        success: true,
        data: menuItem
      });
    } catch (error) {
      console.error('Get menu item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch menu item'
      });
    }
  }

  /**
   * Create new menu item
   */
  async createMenuItem(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { name, description, price, category, image } = req.body;

      // Check if menu item with same name already exists
      const existingItem = await prisma.menuItem.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } }
      });

      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: 'Menu item with this name already exists'
        });
      }

      const menuItem = await prisma.menuItem.create({
        data: {
          name,
          description,
          price: parseFloat(price),
          category,
          image,
          isAvailable: true
        }
      });

      res.status(201).json({
        success: true,
        message: 'Menu item created successfully',
        data: menuItem
      });
    } catch (error) {
      console.error('Create menu item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create menu item'
      });
    }
  }

  /**
   * Update menu item
   */
  async updateMenuItem(req, res) {
    try {
      const { id } = req.params;
      const { name, description, price, category, image, isAvailable } = req.body;

      // Check if menu item exists
      const existingItem = await prisma.menuItem.findUnique({
        where: { id }
      });

      if (!existingItem) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found'
        });
      }

      // Check if name is being changed and if it conflicts with another item
      if (name && name !== existingItem.name) {
        const nameConflict = await prisma.menuItem.findFirst({
          where: {
            name: { equals: name, mode: 'insensitive' },
            id: { not: id }
          }
        });

        if (nameConflict) {
          return res.status(400).json({
            success: false,
            message: 'Menu item with this name already exists'
          });
        }
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (category !== undefined) updateData.category = category;
      if (image !== undefined) updateData.image = image;
      if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

      const menuItem = await prisma.menuItem.update({
        where: { id },
        data: updateData
      });

      res.json({
        success: true,
        message: 'Menu item updated successfully',
        data: menuItem
      });
    } catch (error) {
      console.error('Update menu item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update menu item'
      });
    }
  }

  /**
   * Delete menu item
   */
  async deleteMenuItem(req, res) {
    try {
      const { id } = req.params;

      // Check if menu item exists
      const menuItem = await prisma.menuItem.findUnique({
        where: { id },
        include: {
          orderItems: true
        }
      });

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found'
        });
      }

      // Check if menu item is used in any orders
      if (menuItem.orderItems.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete menu item that has been ordered. Consider marking it as unavailable instead.'
        });
      }

      await prisma.menuItem.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Menu item deleted successfully'
      });
    } catch (error) {
      console.error('Delete menu item error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete menu item'
      });
    }
  }

  /**
   * Toggle menu item availability
   */
  async toggleMenuItemAvailability(req, res) {
    try {
      const { id } = req.params;

      const menuItem = await prisma.menuItem.findUnique({
        where: { id }
      });

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found'
        });
      }

      const updatedItem = await prisma.menuItem.update({
        where: { id },
        data: { isAvailable: !menuItem.isAvailable }
      });

      res.json({
        success: true,
        message: `Menu item ${updatedItem.isAvailable ? 'made available' : 'made unavailable'}`,
        data: updatedItem
      });
    } catch (error) {
      console.error('Toggle menu item availability error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle menu item availability'
      });
    }
  }

  /**
   * Get menu categories
   */
  async getMenuCategories(req, res) {
    try {
      const categories = await prisma.menuItem.findMany({
        select: { category: true },
        where: { category: { not: null } },
        distinct: ['category']
      });

      const categoryList = categories
        .map(item => item.category)
        .filter(Boolean)
        .sort();

      res.json({
        success: true,
        data: categoryList
      });
    } catch (error) {
      console.error('Get menu categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch menu categories'
      });
    }
  }

  /**
   * Get menu statistics
   */
  async getMenuStats(req, res) {
    try {
      const [
        totalItems,
        availableItems,
        unavailableItems,
        categoriesCount,
        averagePrice
      ] = await Promise.all([
        prisma.menuItem.count(),
        prisma.menuItem.count({ where: { isAvailable: true } }),
        prisma.menuItem.count({ where: { isAvailable: false } }),
        prisma.menuItem.groupBy({
          by: ['category'],
          _count: { category: true }
        }),
        prisma.menuItem.aggregate({
          _avg: { price: true }
        })
      ]);

      res.json({
        success: true,
        data: {
          totalItems,
          availableItems,
          unavailableItems,
          categoriesCount: categoriesCount.length,
          averagePrice: averagePrice._avg.price || 0
        }
      });
    } catch (error) {
      console.error('Get menu stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch menu statistics'
      });
    }
  }
}

module.exports = new MenuController();
