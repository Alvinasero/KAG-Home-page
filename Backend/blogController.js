const Blog = require('../Models/Blog');

// Get all blog posts (public)
exports.getAllBlogPosts = async (req, res) => {
    try {
        const posts = await Blog.find().sort({ published_at: -1 });
        res.json(posts);
    } catch (err) {
        console.error('Error fetching blog posts:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get a single blog post by ID (public)
exports.getBlogPostById = async (req, res) => {
    try {
        const post = await Blog.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Blog post not found' });
        res.json(post);
    } catch (err) {
        console.error('Error fetching blog post:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Create a new blog post (admin only)
exports.createBlogPost = async (req, res) => {
    try {
        const newPost = await Blog.create(req.body);
        res.status(201).json({ message: 'Blog post created successfully', post: newPost });
    } catch (err) {
        console.error('Failed to create blog post:', err);
        res.status(500).json({ message: 'Failed to create blog post', error: err.message });
    }
};

// Update a blog post (admin only)
exports.updateBlogPost = async (req, res) => {
    try {
        const updatedPost = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedPost) return res.status(404).json({ message: 'Blog post not found' });
        res.json({ message: 'Blog post updated successfully', post: updatedPost });
    } catch (err) {
        console.error('Failed to update blog post:', err);
        res.status(500).json({ message: 'Failed to update blog post', error: err.message });
    }
};

// Delete a blog post (admin only)
exports.deleteBlogPost = async (req, res) => {
    try {
        const deletedPost = await Blog.findByIdAndDelete(req.params.id);
        if (!deletedPost) return res.status(404).json({ message: 'Blog post not found' });
        res.json({ message: 'Blog post deleted successfully' });
    } catch (err) {
        console.error('Failed to delete blog post:', err);
        res.status(500).json({ message: 'Failed to delete blog post', error: err.message });
    }
};