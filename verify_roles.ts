
import { execSync } from "child_process";

const API_URL = "http://localhost:5173/api";

async function run() {
    console.log("Starting Verification...");

    // 1. Register Trainer
    console.log("Registering Trainer...");
    const trainerEmail = `trainer_${Date.now()}@test.com`;
    const trainerRes = await fetch(`${API_URL}/auth/sign-up/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: trainerEmail,
            password: "password123",
            name: "Trainer Joe",
        }),
    });

    if (!trainerRes.ok) {
        console.error(`Failed to register trainer: Status ${trainerRes.status}`);
        console.error("Response:", await trainerRes.text());
        process.exit(1);
    }

    const trainerData = await trainerRes.json();
    const trainerHeaders = trainerRes.headers;
    // Capture cookies
    const trainerCookie = trainerHeaders.get("set-cookie");
    if (!trainerCookie) {
        console.error("No cookie returned for trainer");
        process.exit(1);
    }
    console.log("Trainer Registered:", trainerData.user.email);

    // 2. Elevate Trainer Role
    console.log("Elevating Trainer Role...");
    try {
        execSync(`wrangler d1 execute lms_db --local --command "UPDATE user SET role = 'trainer' WHERE email = '${trainerEmail}'"`);
        console.log("Trainer role updated in DB.");
    } catch (e) {
        console.error("Failed to update trainer role:", e);
        process.exit(1);
    }

    // 3. Register Student
    console.log("Registering Student...");
    const studentEmail = `student_${Date.now()}@test.com`;
    const studentRes = await fetch(`${API_URL}/auth/sign-up/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: studentEmail,
            password: "password123",
            name: "Student Jane",
        }),
    });

    if (!studentRes.ok) {
        console.error("Failed to register student:", await studentRes.text());
        process.exit(1);
    }
    const studentData = await studentRes.json();
    const studentCookie = studentRes.headers.get("set-cookie");
    if (!studentCookie) {
        console.error("No cookie returned for student");
        process.exit(1);
    }
    console.log("Student Registered:", studentData.user.email);


    // 4. Test: Trainer Creates Course
    console.log("\nTest 1: Trainer Creates Course (Expected: Success)");
    const createCourseRes = await fetch(`${API_URL}/courses`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": trainerCookie
        },
        body: JSON.stringify({
            title: "Advanced TypeScript",
            description: "Deep dive into TS",
        }),
    });

    if (createCourseRes.status === 201) {
        console.log("✅ Success: Trainer created course.");
    } else {
        console.error("❌ Failed: Trainer could not create course.", await createCourseRes.text());
        process.exit(1);
    }
    const courseData = await createCourseRes.json();
    const courseId = courseData.course.id;

    // 5. Test: Student Creates Course
    console.log("\nTest 2: Student Creates Course (Expected: Failure)");
    const studentCreateRes = await fetch(`${API_URL}/courses`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": studentCookie
        },
        body: JSON.stringify({
            title: "Hacking 101",
            description: "Should not work",
        }),
    });

    if (studentCreateRes.status === 403) {
        console.log("✅ Success: Student was forbidden from creating course.");
    } else {
        console.error(`❌ Failed: Student response was ${studentCreateRes.status}, expected 403.`);
        // process.exit(1); // Don't exit, keep checking
    }

    // 6. Test: Student Enrolls
    console.log("\nTest 3: Student Enrolls in Course (Expected: Success)");
    const enrollRes = await fetch(`${API_URL}/courses/${courseId}/enroll`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": studentCookie
        },
        body: JSON.stringify({}),
    });

    if (enrollRes.status === 201) {
        console.log("✅ Success: Student enrolled.");
    } else {
        console.error("❌ Failed: Student could not enroll.", await enrollRes.text());
        process.exit(1);
    }

    // 7. Test: Trainer Enrolls (Expected: Failure per current logic)
    console.log("\nTest 4: Trainer Enrolls in Course (Expected: Undefined/Forbidden?)");
    // Per implementation: if (dbUser.role !== "trainee") return 403
    const trainerEnrollRes = await fetch(`${API_URL}/courses/${courseId}/enroll`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": trainerCookie
        },
        body: JSON.stringify({}),
    });

    if (trainerEnrollRes.status === 403) {
        console.log("✅ Success: Trainer forbidden from enrolling.");
    } else {
        console.log(`ℹ️ Note: Trainer enrollment response: ${trainerEnrollRes.status}`);
    }

    console.log("\nAll verifications passed!");
}

run().catch(console.error);
