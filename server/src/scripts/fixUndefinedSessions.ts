import mongoose from "mongoose";
import { Student } from "../models/Student";
import { Term } from "../models/Term";
import { AuditLog } from "../models/AuditLog";
import { User } from "../models/User";
import "../models/Session"; // Register Session model
import dotenv from "dotenv";

dotenv.config();

const fixUndefinedSessions = async () => {
  try {
    console.log("Starting undefined session fix...");

    const startTime = Date.now();
    let totalFixed = 0;
    let studentsAffected = 0;

    // Get an admin user for audit logging
    const adminUser = await User.findOne({
      role: { $in: ["admin", "superadmin"] },
    }).select("_id");
    if (!adminUser) {
      throw new Error("No admin user found for audit logging");
    }

    // Get all terms with session populated for lookup
    const terms = await Term.find({}).populate("sessionId", "name");
    const termSessionMap = new Map<string, string>();

    terms.forEach((term: any) => {
      const sessionName = term.sessionId?.name || "Unknown Session";
      termSessionMap.set(term.name, sessionName);
    });

    console.log(`Loaded ${terms.length} terms for session lookup`);

    // Debug: Log term session mapping
    console.log("Term to session mapping:");
    terms.forEach((term: any) => {
      console.log(
        `  Term "${term.name}": sessionId=${
          term.sessionId?._id
        }, sessionName="${term.sessionId?.name || "NO SESSION"}"`
      );
    });

    // Find all students with termFees
    const students = await Student.find({
      termFees: { $exists: true, $ne: [] },
    }).select("_id fullName studentId termFees");

    console.log(
      `Checking ${students.length} students for undefined sessions...`
    );

    // Debug: Log all fees to see what sessions exist
    for (const student of students) {
      if (student.termFees && student.termFees.length > 0) {
        console.log(`Student ${student.fullName} has fees:`);
        student.termFees.forEach((fee: any, index: number) => {
          console.log(
            `  Fee ${index}: term="${fee.term}", session="${
              fee.session
            }" (type: ${typeof fee.session})`
          );
        });
      }
    }

    for (const student of students) {
      if (!student.termFees || student.termFees.length === 0) continue;

      let studentFixed = false;

      // Check each fee for incorrect session (undefined, null, empty, or "Unknown Session")
      for (const fee of student.termFees) {
        if (
          fee.session === undefined ||
          fee.session === null ||
          fee.session === "" ||
          fee.session === "Unknown Session"
        ) {
          // Look up the correct session name for this term
          const correctSession = termSessionMap.get(fee.term);

          if (correctSession) {
            console.log(
              `Fixing undefined session for student ${student.fullName}: ${fee.term} -> session: "${correctSession}"`
            );

            fee.session = correctSession;
            totalFixed++;
            studentFixed = true;
          } else {
            console.warn(
              `Could not find session for term "${fee.term}" - leaving as undefined`
            );
          }
        }
      }

      // Save the student if any fees were fixed
      if (studentFixed) {
        await student.save();
        studentsAffected++;
      }
    }

    const duration = Date.now() - startTime;

    // Create audit log
    await AuditLog.create({
      userId: adminUser._id,
      actionType: "FEE_RECONCILIATION",
      description: `Fixed undefined sessions in student fees: ${totalFixed} fees updated across ${studentsAffected} students in ${duration}ms`,
      targetId: null,
    });

    console.log("=== SESSION FIX SUMMARY ===");
    console.log(`Total fees fixed: ${totalFixed}`);
    console.log(`Students affected: ${studentsAffected}`);
    console.log(`Duration: ${duration}ms`);
    console.log("============================");

    console.log("✅ Session fix completed successfully!");
  } catch (error: any) {
    console.error("Error during session fix:", error);
    throw error;
  }
};

// Run the script if called directly
if (require.main === module) {
  (async () => {
    const dbUrl =
      process.env.MONGODB_URI ||
      process.env.DATABASE_URL ||
      process.env.MONGO_URI ||
      "mongodb://localhost:27017/schoolms";

    await mongoose.connect(dbUrl);
    console.log(`Connected to MongoDB at ${dbUrl}`);

    await fixUndefinedSessions();

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");

    process.exit(0);
  })().catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
}

export { fixUndefinedSessions };
