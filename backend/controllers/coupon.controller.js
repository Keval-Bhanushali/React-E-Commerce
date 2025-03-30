import Coupon from "../models/coupon.model.js";

export const getCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.find({ userId: req.user._id, isActive: true });
        res.json(coupon || null);
    } catch (error) {
        console.error("Error getCoupon Controller:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export const validateCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        const coupon = await Coupon.findOne({ code: code, userId: req.user._id, isActive: true });
        if (!coupon) {
            return res.status(404).json({ message: "Coupon not found" });
        }
        if (coupon.expirationDate < new Date()) {
            coupon.isActive = false; // Mark the coupon as inactive if expired
            await coupon.save(); // Save the coupon to update its status
            return res.status(400).json({ message: "Coupon has expired" });
        }
        res.json({
            message: "Coupon is valid",
            coupon: coupon.code,
            discountPercentage: coupon.discountPercentage
        });
    } catch (error) {
        console.error("Error validateCoupon Controller:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}