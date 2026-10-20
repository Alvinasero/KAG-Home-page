const Member = require('../Models/Member');
const Donation = require('../Models/Donation');
const Prayer = require('../Models/Prayer');
const Sermon = require('../Models/Sermon');
const User = require('../Models/User');

/**
 * Get overall church statistics for the Admin Dashboard
 */
exports.getDashboardStats = async (req, res) => {
    try {
        const [memberCount, donationSum, pendingPrayers, sermonCount, totalUsers] = await Promise.all([
            Member.countDocuments(),
            Donation.aggregate([
                { $match: { status: 'Completed' } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]),
            Prayer.countDocuments({ status: 'Pending' }),
            Sermon.countDocuments(),
            User.countDocuments()
        ]);

        res.json({
            totalMembers: memberCount,
            totalDonations: donationSum[0]?.total || 0,
            pendingPrayerRequests: pendingPrayers,
            totalSermons: sermonCount,
            systemUsers: totalUsers,
            currency: 'KES'
        });
    } catch (err) {
        console.error('Dashboard Stats Error:', err);
        res.status(500).json({ message: 'Error fetching administrative statistics', error: err.message });
    }
};