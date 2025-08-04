import { User } from "../models/User";

export const seedSuperAdmin = async () => {
  try {
    // Check if any superadmin exists
    const superAdminExists = await User.findOne({ role: "superadmin" });

    if (!superAdminExists) {
      // Create super admin if none exists
      await User.create({
        name: "Super Admin",
        email: process.env.SUPER_ADMIN_EMAIL || "admin@treasureland.com",
        password: process.env.SUPER_ADMIN_PASSWORD || "Admin@123",
        role: "superadmin",
        verified: true,
      });

      console.log("🔐 Super Admin created successfully");
    }
  } catch (error: any) {
    console.error("Error seeding super admin:", error.message);
  }
};
