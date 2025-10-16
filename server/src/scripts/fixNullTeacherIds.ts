import mongoose from "mongoose";
import { Classroom } from "../models/Classroom";
import { User } from "../models/User";
import { Types } from "mongoose";

async function fixNullTeacherIds() {
  try {
    console.log("Starting to fix classrooms with null teacherId...");

    // Find all classrooms with null teacherId
    const classroomsWithNullTeacher = await Classroom.find({ teacherId: null });

    console.log(
      `Found ${classroomsWithNullTeacher.length} classrooms with null teacherId`
    );

    for (const classroom of classroomsWithNullTeacher) {
      console.log(`Processing classroom: ${classroom.name} (${classroom._id})`);

      // Check if there's a teacher assigned to this classroom via the old assignedClassId field
      const teacher = await User.findOne({
        role: "teacher",
        assignedClassId: classroom._id,
      });

      if (teacher) {
        console.log(
          `Found teacher ${teacher.name} for classroom ${classroom.name}`
        );
        classroom.teacherId = teacher._id as any;
        await classroom.save();
        console.log(
          `Updated classroom ${classroom.name} with teacher ${teacher.name}`
        );
      } else {
        console.log(
          `No teacher found for classroom ${classroom.name} - leaving as null`
        );
      }
    }

    console.log("Finished fixing classrooms with null teacherId");
  } catch (error) {
    console.error("Error fixing null teacherIds:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script if called directly
if (require.main === module) {
  // Connect to MongoDB (adjust connection string as needed)
  mongoose
    .connect(
      process.env.MONGODB_URI ||
        "mongodb+srv://isaacanyim:Lezico123@isaacdev.bpnm7.mongodb.net/treasureland?retryWrites=true&w=majority&appName=Isaacdev"
    )
    .then(() => {
      console.log("Connected to MongoDB");
      return fixNullTeacherIds();
    })
    .catch((error) => {
      console.error("MongoDB connection error:", error);
      process.exit(1);
    });
}

export { fixNullTeacherIds };
