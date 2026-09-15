/**
 * Comprehensive Automated Audit:
 * 1. Parent Portal Endpoints & Token Authentication
 * 2. Security & Data Isolation (Ward Isolation, Unauthenticated Requests, Token Verification, Rate Limiting)
 * 3. Doctor Specialty Station Merging & Field Isolation
 * 4. Automatic cleanup
 */

import { PrismaClient } from "@prisma/client";
import { unlink } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

// Test Students
const ADM_A = "1173";
const DOB_A = "2013-04-06";
const ADM_B = "TEPS01";
const DOB_B = "2009-05-31";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedCount++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedCount++;
    console.error(`  [FAIL] ${testName} ${detail ? `-> ${detail}` : ""}`);
  }
}

async function runAudit() {
  console.log("================================================================================");
  console.log("  STARTING HEALTH APP RBAC, DATA ISOLATION & PARENT PORTAL AUDIT");
  console.log(`  Target: ${BASE_URL}`);
  console.log("================================================================================\n");

  // Step 0: Capture baseline state for Student A and Student B to ensure 100% clean rollback
  const initialStudentA = await prisma.student.findUnique({ where: { admissionNumber: ADM_A } });
  const initialStudentB = await prisma.student.findUnique({ where: { admissionNumber: ADM_B } });

  if (!initialStudentA || !initialStudentB) {
    throw new Error("Target audit students (1173, TEPS01) not found in database.");
  }

  const createdAttachmentIds: number[] = [];
  const createdAttachmentFiles: string[] = [];

  try {
    // =========================================================================
    // 1. AUDIT PARENT PORTAL ENDPOINTS
    // =========================================================================
    console.log("=== SECTION 1: PARENT PORTAL ENDPOINTS & PAYLOAD AUDIT ===");

    // 1.1 POST /api/parent/verify (Valid verification)
    console.log("\n--- Testing POST /api/parent/verify ---");
    const testIpNormal = `10.0.1.${Math.floor(Math.random() * 200) + 1}`;
    const resVerifyA = await fetch(`${BASE_URL}/api/parent/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": testIpNormal },
      body: JSON.stringify({ admissionNumber: ADM_A, dob: DOB_A }),
    });
    assert(resVerifyA.status === 200, "POST /api/parent/verify returns HTTP 200 for valid student", `Status: ${resVerifyA.status}`);
    const dataVerifyA = await resVerifyA.json();
    const tokenA = dataVerifyA.token;
    assert(typeof tokenA === "string" && tokenA.length > 20, "Verify issues signed parent JWT token");
    assert(dataVerifyA.profile && dataVerifyA.profile.student.admissionNumber === ADM_A, "Profile payload contains student data");
    assert(Array.isArray(dataVerifyA.profile.checkups), "Profile payload includes checkups array");
    assert(Array.isArray(dataVerifyA.profile.immunizations), "Profile payload includes immunizations array");
    assert(Array.isArray(dataVerifyA.profile.observations), "Profile payload includes observations array");
    assert(Array.isArray(dataVerifyA.profile.attachments), "Profile payload includes attachments array");

    // Also get Token B for isolation tests
    const resVerifyB = await fetch(`${BASE_URL}/api/parent/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": testIpNormal },
      body: JSON.stringify({ admissionNumber: ADM_B, dob: DOB_B }),
    });
    const dataVerifyB = await resVerifyB.json();
    const tokenB = dataVerifyB.token;
    assert(resVerifyB.status === 200 && typeof tokenB === "string", "Token B generated successfully for Student B");

    // Invalid DOB
    const resVerifyBadDob = await fetch(`${BASE_URL}/api/parent/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": testIpNormal },
      body: JSON.stringify({ admissionNumber: ADM_A, dob: "2010-01-01" }),
    });
    assert(resVerifyBadDob.status === 404, "POST /api/parent/verify rejects incorrect DOB with 404");
    const errBadDob = await resVerifyBadDob.json();
    assert(errBadDob.error && errBadDob.error.includes("No matching health record"), "Error message is generic without revealing mismatch reason");

    // Invalid Admission
    const resVerifyBadAdm = await fetch(`${BASE_URL}/api/parent/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": testIpNormal },
      body: JSON.stringify({ admissionNumber: "NON-EXISTENT-999", dob: "2013-04-06" }),
    });
    assert(resVerifyBadAdm.status === 404, "POST /api/parent/verify rejects non-existent student with 404");

    // Malformed body
    const resVerifyMalformed = await fetch(`${BASE_URL}/api/parent/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": testIpNormal },
      body: JSON.stringify({ admissionNumber: "" }),
    });
    assert(resVerifyMalformed.status === 400, "POST /api/parent/verify rejects malformed body with 400");

    // 1.2 POST /api/parent/blood-group
    console.log("\n--- Testing POST /api/parent/blood-group ---");
    const resBloodGroup = await fetch(`${BASE_URL}/api/parent/blood-group`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-parent-token": tokenA,
      },
      body: JSON.stringify({ admissionNumber: ADM_A, bloodGroup: "O+", token: tokenA }),
    });
    assert(resBloodGroup.status === 200, "Parent can update student blood group to O+ (HTTP 200)", `Status: ${resBloodGroup.status}`);
    const updatedStudentA = await prisma.student.findUnique({ where: { admissionNumber: ADM_A } });
    assert(updatedStudentA?.bloodGroup === "O+", "Database reflects blood group update to O+");

    // Invalid blood group
    const resBadBlood = await fetch(`${BASE_URL}/api/parent/blood-group`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admissionNumber: ADM_A, bloodGroup: "INVALID_BG", token: tokenA }),
    });
    assert(resBadBlood.status === 400, "Rejects invalid blood group with 400 Bad Request");

    // 1.3 POST /api/parent/conditions & PATCH /api/parent/conditions
    console.log("\n--- Testing POST & PATCH /api/parent/conditions ---");
    const sixConditions = [
      "Mental Illness",
      "Epilepsy",
      "Depression",
      "Chronic Nephritis",
      "Uremia",
      "Infectious Disease",
    ];
    const resConditionsPost = await fetch(`${BASE_URL}/api/parent/conditions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-parent-token": tokenA,
      },
      body: JSON.stringify({
        admissionNumber: ADM_A,
        conditions: sixConditions,
        additionalNotes: "Mild childhood asthma and managed epilepsy",
        token: tokenA,
      }),
    });
    assert(resConditionsPost.status === 200, "Parent declares 6 chronic conditions via POST (HTTP 200)", `Status: ${resConditionsPost.status}`);
    const specialNeedA = await prisma.specialNeed.findUnique({ where: { admissionNumber: ADM_A } });
    assert(
      sixConditions.every((c) => specialNeedA?.chronicIllness?.includes(c)),
      "Database records all 6 declared chronic conditions"
    );
    assert(Boolean(specialNeedA?.chronicIllness?.includes("Mild childhood asthma")), "Additional notes appended correctly");

    // Test PATCH /api/parent/conditions
    const resConditionsPatch = await fetch(`${BASE_URL}/api/parent/conditions`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-parent-token": tokenA,
      },
      body: JSON.stringify({
        admissionNumber: ADM_A,
        conditions: ["Epilepsy"],
        additionalNotes: "Under regular specialist review",
        token: tokenA,
      }),
    });
    assert(resConditionsPatch.status === 200, "Parent updates chronic conditions via PATCH (HTTP 200)");
    const specialNeedUpdated = await prisma.specialNeed.findUnique({ where: { admissionNumber: ADM_A } });
    assert(specialNeedUpdated?.chronicIllness === "Epilepsy (Notes: Under regular specialist review)", "PATCH updates chronicIllness string cleanly");

    // 1.4 POST /api/parent/card-details
    console.log("\n--- Testing POST /api/parent/card-details ---");
    const resCardDetails = await fetch(`${BASE_URL}/api/parent/card-details`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-parent-token": tokenA,
      },
      body: JSON.stringify({
        admissionNumber: ADM_A,
        token: tokenA,
        aadhaarNumber: "123456789012",
        parentName: "Dr. Varrier",
        phone: "9876543210",
        emergencyContact: "9123456780",
        address: "123 Palakkad Main Road",
        identificationMarks: "Mole on left cheek",
      }),
    });
    assert(resCardDetails.status === 200, "Parent updates card details (HTTP 200)", `Status: ${resCardDetails.status}`);
    const cardStudentA = await prisma.student.findUnique({ where: { admissionNumber: ADM_A } });
    assert(cardStudentA?.aadhaarNumber === "1234 5678 9012", "12-digit Aadhaar formatted to 'XXXX XXXX XXXX'");
    assert(cardStudentA?.emergencyContact === "9123456780", "Emergency contact phone updated");
    assert(cardStudentA?.address === "123 Palakkad Main Road", "Address updated");
    assert(cardStudentA?.identificationMarks === "Mole on left cheek", "Identification marks updated");

    // 1.5 POST /api/parent/immunizations
    console.log("\n--- Testing POST /api/parent/immunizations ---");
    const resImm = await fetch(`${BASE_URL}/api/parent/immunizations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-parent-token": tokenA,
      },
      body: JSON.stringify({
        admissionNumber: ADM_A,
        token: tokenA,
        vaccines: [
          {
            vaccine: "MMR (Measles, Mumps, Rubella)",
            dose: "1st Dose",
            date: "2015-06-15",
            remarks: "Administered at District Hospital",
          },
          {
            vaccine: "Chickenpox (Varicella)",
            dose: "1st Dose",
            date: "2016-08-20",
          },
        ],
      }),
    });
    assert(resImm.status === 201, "Parent submits vaccination records (HTTP 201 Created)", `Status: ${resImm.status}`);
    const dataImm = await resImm.json();
    assert(dataImm.count === 2, "Response confirms 2 vaccines recorded");
    const dbImms = await prisma.immunization.findMany({ where: { admissionNumber: ADM_A } });
    assert(dbImms.some((i) => i.vaccine.includes("MMR") && i.remarks?.includes("(Declared by Parent)")), "Vaccine remarks tagged with '(Declared by Parent)'");

    // 1.6 POST /api/parent/uploads & GET /api/parent/files/[id]
    console.log("\n--- Testing POST /api/parent/uploads & GET /api/parent/files/[id] ---");
    const dummyPdfContent = "%PDF-1.4 test medical certificate for student A";
    const uploadFormA = new FormData();
    uploadFormA.append("admissionNumber", ADM_A);
    uploadFormA.append("category", "Medical Report");
    uploadFormA.append("token", tokenA);
    uploadFormA.append("file", new Blob([dummyPdfContent], { type: "application/pdf" }), "audit_report_A.pdf");

    const resUploadA = await fetch(`${BASE_URL}/api/parent/uploads`, {
      method: "POST",
      headers: {
        "x-parent-token": tokenA,
      },
      body: uploadFormA,
    });
    assert(resUploadA.status === 201, "Parent uploads medical document (HTTP 201)", `Status: ${resUploadA.status}`);
    const uploadDataA = await resUploadA.json();
    const attachmentAId = uploadDataA.attachment.id;
    createdAttachmentIds.push(attachmentAId);
    createdAttachmentFiles.push(uploadDataA.attachment.storedName);

    // Test download via GET /api/parent/files/[id]
    const resGetParentFileA = await fetch(`${BASE_URL}/api/parent/files/${attachmentAId}?token=${encodeURIComponent(tokenA)}`);
    assert(resGetParentFileA.status === 200, "GET /api/parent/files/:id serves document with parent token (HTTP 200)", `Status: ${resGetParentFileA.status}`);
    const downloadedTextA = await resGetParentFileA.text();
    assert(downloadedTextA === dummyPdfContent, "Downloaded content matches uploaded document exactly");
    assert(resGetParentFileA.headers.get("content-type") === "application/pdf", "Content-Type header is application/pdf");

    // Test download via GET /api/files/[id]?t=[token]
    const resGetFilesA = await fetch(`${BASE_URL}/api/files/${attachmentAId}?t=${encodeURIComponent(tokenA)}`);
    assert(resGetFilesA.status === 200, "GET /api/files/:id?t=... serves document with parent token (HTTP 200)");


    // =========================================================================
    // 2. AUDIT SECURITY AND DATA ISOLATION
    // =========================================================================
    console.log("\n=== SECTION 2: SECURITY AND DATA ISOLATION AUDIT ===");

    // 2.1 Ward Isolation: Parent A -> Student B
    console.log("\n--- Testing Ward Isolation (Parent A attempting cross-ward access on Student B) ---");

    // Blood group cross-ward attempt
    const resIsoBlood = await fetch(`${BASE_URL}/api/parent/blood-group`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admissionNumber: ADM_B, bloodGroup: "AB+", token: tokenA }),
    });
    assert(resIsoBlood.status === 401, "Cross-ward blood group update rejected with HTTP 401 Unauthorized", `Status: ${resIsoBlood.status}`);

    // Conditions cross-ward attempt
    const resIsoCond = await fetch(`${BASE_URL}/api/parent/conditions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admissionNumber: ADM_B, conditions: ["Epilepsy"], token: tokenA }),
    });
    assert(resIsoCond.status === 401, "Cross-ward conditions update rejected with HTTP 401 Unauthorized", `Status: ${resIsoCond.status}`);

    // Card details cross-ward attempt
    const resIsoCard = await fetch(`${BASE_URL}/api/parent/card-details`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        admissionNumber: ADM_B,
        parentName: "Attacker",
        phone: "9999999999",
        token: tokenA,
      }),
    });
    assert(resIsoCard.status === 401, "Cross-ward card details update rejected with HTTP 401 Unauthorized", `Status: ${resIsoCard.status}`);

    // Immunization cross-ward attempt
    const resIsoImm = await fetch(`${BASE_URL}/api/parent/immunizations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        admissionNumber: ADM_B,
        token: tokenA,
        vaccines: [{ vaccine: "Hepatitis B", dose: "1st Dose" }],
      }),
    });
    assert(resIsoImm.status === 401, "Cross-ward immunization submission rejected with HTTP 401 Unauthorized", `Status: ${resIsoImm.status}`);

    // Upload cross-ward attempt
    const uploadFormCross = new FormData();
    uploadFormCross.append("admissionNumber", ADM_B);
    uploadFormCross.append("category", "Medical Report");
    uploadFormCross.append("token", tokenA);
    uploadFormCross.append("file", new Blob(["attacker doc"], { type: "application/pdf" }), "cross_ward.pdf");

    const resIsoUpload = await fetch(`${BASE_URL}/api/parent/uploads`, {
      method: "POST",
      body: uploadFormCross,
    });
    assert(resIsoUpload.status === 401, "Cross-ward upload rejected with HTTP 401 Unauthorized", `Status: ${resIsoUpload.status}`);

    // Upload document legitimately for Student B using Token B
    const uploadFormB = new FormData();
    uploadFormB.append("admissionNumber", ADM_B);
    uploadFormB.append("category", "Medical Report");
    uploadFormB.append("token", tokenB);
    uploadFormB.append("file", new Blob(["Student B secret health record"], { type: "application/pdf" }), "student_B_doc.pdf");

    const resUploadB = await fetch(`${BASE_URL}/api/parent/uploads`, {
      method: "POST",
      body: uploadFormB,
    });
    const uploadDataB = await resUploadB.json();
    const attachmentBId = uploadDataB.attachment.id;
    createdAttachmentIds.push(attachmentBId);
    createdAttachmentFiles.push(uploadDataB.attachment.storedName);

    // Parent A attempts to download Student B's document via GET /api/parent/files/[idB]
    const resIsoGetParentFile = await fetch(`${BASE_URL}/api/parent/files/${attachmentBId}?token=${encodeURIComponent(tokenA)}`);
    assert(resIsoGetParentFile.status === 403, "Cross-ward document access via GET /api/parent/files/:id rejected with HTTP 403 Forbidden", `Status: ${resIsoGetParentFile.status}`);

    // Parent A attempts to download Student B's document via GET /api/files/[idB]?t=[tokenA]
    const resIsoGetFile = await fetch(`${BASE_URL}/api/files/${attachmentBId}?t=${encodeURIComponent(tokenA)}`);
    assert(resIsoGetFile.status === 401, "Cross-ward document access via GET /api/files/:id?t=... rejected with HTTP 401 Unauthorized", `Status: ${resIsoGetFile.status}`);

    // Parent A attempts to delete Student B's document via DELETE /api/parent/files/[idB]
    const resIsoDeleteFile = await fetch(`${BASE_URL}/api/parent/files/${attachmentBId}?token=${encodeURIComponent(tokenA)}`, {
      method: "DELETE",
    });
    assert(resIsoDeleteFile.status === 403, "Cross-ward document deletion via DELETE /api/parent/files/:id rejected with HTTP 403 Forbidden", `Status: ${resIsoDeleteFile.status}`);

    // Verify Student B's document still exists in DB
    const docBStillExists = await prisma.attachment.findUnique({ where: { id: attachmentBId } });
    assert(Boolean(docBStillExists), "Student B's document remained intact and protected against unauthorized deletion");

    // 2.2 Unauthenticated Requests
    console.log("\n--- Testing Unauthenticated Requests (No token provided) ---");
    const unauthBlood = await fetch(`${BASE_URL}/api/parent/blood-group`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admissionNumber: ADM_A, bloodGroup: "O+" }),
    });
    assert(unauthBlood.status === 400 || unauthBlood.status === 401, "Unauthenticated /api/parent/blood-group rejected");

    const unauthConditions = await fetch(`${BASE_URL}/api/parent/conditions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admissionNumber: ADM_A, conditions: ["Epilepsy"] }),
    });
    assert(unauthConditions.status === 400 || unauthConditions.status === 401, "Unauthenticated /api/parent/conditions rejected");

    const unauthUpload = await fetch(`${BASE_URL}/api/parent/uploads`, {
      method: "POST",
      body: new FormData(),
    });
    assert(unauthUpload.status === 400 || unauthUpload.status === 401, "Unauthenticated /api/parent/uploads rejected");

    const unauthGetParentFile = await fetch(`${BASE_URL}/api/parent/files/${attachmentAId}`);
    assert(unauthGetParentFile.status === 401, "Unauthenticated GET /api/parent/files/:id rejected with HTTP 401");

    const unauthGetFile = await fetch(`${BASE_URL}/api/files/${attachmentAId}`);
    assert(unauthGetFile.status === 401, "Unauthenticated GET /api/files/:id rejected with HTTP 401");

    const unauthDeleteParentFile = await fetch(`${BASE_URL}/api/parent/files/${attachmentAId}`, { method: "DELETE" });
    assert(unauthDeleteParentFile.status === 401, "Unauthenticated DELETE /api/parent/files/:id rejected with HTTP 401");

    // 2.3 Token Signature Verification & Tampering
    console.log("\n--- Testing Token Signature Verification & Tampering ---");
    const tamperedToken = tokenA.slice(0, -5) + "abcde";
    const resTampered = await fetch(`${BASE_URL}/api/parent/blood-group`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admissionNumber: ADM_A, bloodGroup: "B+", token: tamperedToken }),
    });
    assert(resTampered.status === 401, "Tampered token HMAC signature rejected with HTTP 401 Unauthorized");

    // 2.4 Rate Limiting
    console.log("\n--- Testing In-Memory Rate Limiting ---");
    // Test verify rate limiting (10 attempts per IP window)
    const testIpVerify = "203.0.113.88";
    let verifyRateLimitHit = false;
    for (let i = 0; i < 12; i++) {
      const res = await fetch(`${BASE_URL}/api/parent/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": testIpVerify,
        },
        body: JSON.stringify({ admissionNumber: ADM_A, dob: "2000-01-01" }), // intentional wrong dob
      });
      if (res.status === 429) {
        verifyRateLimitHit = true;
        break;
      }
    }
    assert(verifyRateLimitHit, "Rate limiting triggers HTTP 429 Too Many Requests on /api/parent/verify (threshold: 10)");

    // Test blood-group rate limiting (20 attempts per IP window)
    const testIpBlood = "203.0.113.89";
    let bloodRateLimitHit = false;
    for (let i = 0; i < 22; i++) {
      const res = await fetch(`${BASE_URL}/api/parent/blood-group`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": testIpBlood,
        },
        body: JSON.stringify({ admissionNumber: ADM_A, bloodGroup: "O+", token: tokenA }),
      });
      if (res.status === 429) {
        bloodRateLimitHit = true;
        break;
      }
    }
    assert(bloodRateLimitHit, "Rate limiting triggers HTTP 429 Too Many Requests on /api/parent/blood-group (threshold: 20)");


    // =========================================================================
    // 3. AUDIT DOCTOR SPECIALTY STATION MERGING & FIELD ISOLATION
    // =========================================================================
    console.log("\n=== SECTION 3: DOCTOR SPECIALTY STATION MERGING & FIELD ISOLATION ===");

    // Helper to log in doctors and extract cookie
    async function loginDoctor(username: string, password = "doctor123") {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const cookieHeader = res.headers.get("set-cookie") || "";
      const match = cookieHeader.match(/shrm_session=([^;]+)/);
      return match ? match[1] : null;
    }

    const dentalCookie = await loginDoctor("drdental");
    const eyeCookie = await loginDoctor("dreye");
    const generalCookie = await loginDoctor("drmehta");
    const adminCookie = await loginDoctor("admin", "admin123");

    assert(Boolean(dentalCookie), "doctor_dental (drdental) logged in successfully");
    assert(Boolean(eyeCookie), "doctor_eye (dreye) logged in successfully");
    assert(Boolean(generalCookie), "doctor_general (drmehta) logged in successfully");
    assert(Boolean(adminCookie), "admin logged in successfully");

    const AY = "2025-2026";

    // Clean up any existing checkup for Student A in AY 2025-2026 before starting test
    await prisma.healthCheckup.deleteMany({
      where: { admissionNumber: ADM_A, academicYear: AY },
    });

    // 3.1 Initial Dental Station Creation via POST /api/checkups
    console.log("\n--- Station 1: doctor_dental initializes checkup ---");
    const resDentalInit = await fetch(`${BASE_URL}/api/checkups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `shrm_session=${dentalCookie}`,
      },
      body: JSON.stringify({
        admissionNumber: ADM_A,
        academicYear: AY,
        checkupDate: "2025-10-10",
        doctorName: "Dr. Vikram Seth (Dental)",
        dentalHealth: "Cavities",
        // Dental doctor maliciously/mistakenly tries to inject vitals and eye data
        height: 185,
        weight: 90,
        eyesightLeft: "6/18",
        eyesightRight: "6/18",
        bloodPressure: "150/100",
        entEars: "Otitis Media",
      }),
    });
    assert(resDentalInit.status === 201, "Dental doctor creates initial checkup record (HTTP 201 Created)", `Status: ${resDentalInit.status}`);
    const checkupAfterDental = await prisma.healthCheckup.findUnique({
      where: { admissionNumber_academicYear: { admissionNumber: ADM_A, academicYear: AY } },
    });
    assert(checkupAfterDental?.dentalHealth === "Cavities", "Dental health recorded as 'Cavities'");
    assert(checkupAfterDental?.height === 0 && checkupAfterDental?.weight === 0, "Height and weight defaulted to 0 (dental doctor cannot set vitals)");
    assert(checkupAfterDental?.eyesightLeft === "Pending Exam", "Eyesight left defaulted to 'Pending Exam' (dental doctor cannot set eyesight)");
    assert(checkupAfterDental?.bloodPressure === "Pending Exam", "Blood pressure defaulted to 'Pending Exam' (dental doctor cannot set vitals)");
    assert(checkupAfterDental?.entEars === "Pending Exam", "ENT defaulted to 'Pending Exam' (dental doctor cannot set ENT)");

    // 3.2 Eye Doctor Station Merging via POST /api/checkups
    console.log("\n--- Station 2: doctor_eye merges visual acuity into checkup ---");
    const resEyeMerge = await fetch(`${BASE_URL}/api/checkups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `shrm_session=${eyeCookie}`,
      },
      body: JSON.stringify({
        admissionNumber: ADM_A,
        academicYear: AY,
        checkupDate: "2025-10-11",
        doctorName: "Dr. Sunita Rao (Eye)",
        eyesightLeft: "6/9",
        eyesightRight: "6/12",
        // Eye doctor attempts to overwrite dental and set vitals
        dentalHealth: "Healthy",
        height: 195,
        entNose: "Nasal Polyp",
      }),
    });
    assert(resEyeMerge.status === 200, "Eye doctor merges exam into existing checkup (HTTP 200)", `Status: ${resEyeMerge.status}`);
    const eyeMergeData = await resEyeMerge.json();
    assert(eyeMergeData.merged === true, "Response indicates station record was merged");
    const checkupAfterEye = await prisma.healthCheckup.findUnique({
      where: { admissionNumber_academicYear: { admissionNumber: ADM_A, academicYear: AY } },
    });
    assert(checkupAfterEye?.eyesightLeft === "6/9" && checkupAfterEye?.eyesightRight === "6/12", "Visual acuity updated to 6/9, 6/12");
    assert(checkupAfterEye?.dentalHealth === "Cavities", "FIELD ISOLATION: Dental finding 'Cavities' preserved against eye doctor overwrite!");
    assert(checkupAfterEye?.height === 0, "FIELD ISOLATION: Height remains 0 (eye doctor cannot set vitals)");
    assert(checkupAfterEye?.entNose === "Pending Exam", "FIELD ISOLATION: ENT remains 'Pending Exam' (eye doctor cannot set ENT)");
    assert(Boolean(checkupAfterEye?.doctorName?.includes("Dental") && checkupAfterEye?.doctorName?.includes("Sunita Rao")), "Doctor names merged smoothly");

    // 3.3 General Doctor Station Merging via POST /api/checkups
    console.log("\n--- Station 3: doctor_general merges vitals & ENT into checkup ---");
    const resGenMerge = await fetch(`${BASE_URL}/api/checkups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `shrm_session=${generalCookie}`,
      },
      body: JSON.stringify({
        admissionNumber: ADM_A,
        academicYear: AY,
        checkupDate: "2025-10-12",
        doctorName: "Dr. Anita Mehta",
        height: 152.5,
        weight: 44.0,
        bloodPressure: "110/70",
        nutritionalStatus: "Normal",
        entEars: "Normal",
        entNose: "Deviated Nasal Septum (DNS)",
        entThroat: "Normal",
        entRemarks: "Mild DNS observed, breathing uncompromised",
        // General doctor attempts to overwrite specialist findings
        dentalHealth: "Needs Attention",
        eyesightLeft: "6/6",
        eyesightRight: "6/6",
      }),
    });
    assert(resGenMerge.status === 200, "General doctor merges vitals into existing checkup (HTTP 200)", `Status: ${resGenMerge.status}`);
    const checkupAfterGen = await prisma.healthCheckup.findUnique({
      where: { admissionNumber_academicYear: { admissionNumber: ADM_A, academicYear: AY } },
    });
    assert(checkupAfterGen?.height === 152.5 && checkupAfterGen?.weight === 44.0, "Vitals updated: height 152.5 cm, weight 44 kg");
    assert(checkupAfterGen?.bmi === 18.9, "BMI accurately calculated to 18.9");
    assert(checkupAfterGen?.bloodPressure === "110/70", "Blood pressure recorded as 110/70");
    assert(checkupAfterGen?.entNose === "Deviated Nasal Septum (DNS)", "ENT nose exam recorded as 'Deviated Nasal Septum (DNS)'");
    assert(checkupAfterGen?.dentalHealth === "Cavities", "STATION MERGE INTEGRITY: Dental 'Cavities' preserved against general doctor!");
    assert(checkupAfterGen?.eyesightLeft === "6/9" && checkupAfterGen?.eyesightRight === "6/12", "STATION MERGE INTEGRITY: Eye findings 6/9, 6/12 preserved against general doctor!");
    assert(
      Boolean(
        checkupAfterGen?.doctorName?.includes("Dental") &&
        checkupAfterGen?.doctorName?.includes("Sunita Rao") &&
        checkupAfterGen?.doctorName?.includes("Anita Mehta")
      ),
      "Doctor names seamlessly merged across all 3 stations"
    );

    // 3.4 Test Field Isolation on PUT /api/checkups/[id]
    console.log("\n--- Testing PUT /api/checkups/:id Field Isolation ---");
    if (!checkupAfterGen) throw new Error("Checkup not found for PUT testing");
    const checkupId = checkupAfterGen.id;

    // Dental doctor calls PUT
    const resDentalPut = await fetch(`${BASE_URL}/api/checkups/${checkupId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: `shrm_session=${dentalCookie}`,
      },
      body: JSON.stringify({
        dentalHealth: "Needs Attention",
        // Attempting to overwrite vitals and eye in PUT
        height: 200,
        weight: 100,
        eyesightLeft: "6/36",
        bloodPressure: "180/120",
        entThroat: "Tonsillitis / Enlarged Tonsils",
      }),
    });
    assert(resDentalPut.status === 200, "Dental doctor calls PUT /api/checkups/:id (HTTP 200)");
    const checkupAfterDentalPut = await prisma.healthCheckup.findUnique({ where: { id: checkupId } });
    assert(checkupAfterDentalPut?.dentalHealth === "Needs Attention", "Dental health updated to 'Needs Attention'");
    assert(checkupAfterDentalPut?.height === 152.5, "PUT FIELD ISOLATION: Height 152.5 cm untouched by dental doctor");
    assert(checkupAfterDentalPut?.eyesightLeft === "6/9", "PUT FIELD ISOLATION: Eyesight 6/9 untouched by dental doctor");
    assert(checkupAfterDentalPut?.bloodPressure === "110/70", "PUT FIELD ISOLATION: Blood pressure untouched by dental doctor");
    assert(checkupAfterDentalPut?.entThroat === "Normal", "PUT FIELD ISOLATION: ENT throat untouched by dental doctor");

    // Eye doctor calls PUT
    const resEyePut = await fetch(`${BASE_URL}/api/checkups/${checkupId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: `shrm_session=${eyeCookie}`,
      },
      body: JSON.stringify({
        eyesightLeft: "6/6",
        eyesightRight: "6/6",
        // Attempting to overwrite dental and vitals in PUT
        dentalHealth: "Healthy",
        height: 210,
        entNose: "Normal",
      }),
    });
    assert(resEyePut.status === 200, "Eye doctor calls PUT /api/checkups/:id (HTTP 200)");
    const checkupAfterEyePut = await prisma.healthCheckup.findUnique({ where: { id: checkupId } });
    assert(checkupAfterEyePut?.eyesightLeft === "6/6" && checkupAfterEyePut?.eyesightRight === "6/6", "Visual acuity updated to 6/6, 6/6");
    assert(checkupAfterEyePut?.dentalHealth === "Needs Attention", "PUT FIELD ISOLATION: Dental finding preserved against eye doctor");
    assert(checkupAfterEyePut?.height === 152.5, "PUT FIELD ISOLATION: Height preserved against eye doctor");
    assert(checkupAfterEyePut?.entNose === "Deviated Nasal Septum (DNS)", "PUT FIELD ISOLATION: ENT nose finding preserved against eye doctor");

    // General doctor calls PUT
    const resGenPut = await fetch(`${BASE_URL}/api/checkups/${checkupId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: `shrm_session=${generalCookie}`,
      },
      body: JSON.stringify({
        height: 154.0,
        weight: 45.5,
        bloodPressure: "112/72",
        // Attempting to overwrite specialist findings in PUT
        dentalHealth: "Healthy",
        eyesightLeft: "6/18",
        eyesightRight: "6/18",
      }),
    });
    assert(resGenPut.status === 200, "General doctor calls PUT /api/checkups/:id (HTTP 200)");
    const checkupAfterGenPut = await prisma.healthCheckup.findUnique({ where: { id: checkupId } });
    assert(checkupAfterGenPut?.height === 154.0 && checkupAfterGenPut?.weight === 45.5, "PUT: Vitals updated by general doctor");
    assert(checkupAfterGenPut?.dentalHealth === "Needs Attention", "PUT FIELD ISOLATION: Specialist dental finding preserved against general doctor");
    assert(checkupAfterGenPut?.eyesightLeft === "6/6" && checkupAfterGenPut?.eyesightRight === "6/6", "PUT FIELD ISOLATION: Specialist eye finding preserved against general doctor");

  } finally {
    // =========================================================================
    // 4. CLEAN UP
    // =========================================================================
    console.log("\n=== SECTION 4: POST-AUDIT CLEANUP ===");

    // 4.1 Delete created attachments
    for (const attId of createdAttachmentIds) {
      try {
        await prisma.attachment.delete({ where: { id: attId } });
      } catch {}
    }
    // Delete test files from disk
    for (const filename of createdAttachmentFiles) {
      try {
        await unlink(path.join(process.cwd(), "upload", filename));
      } catch {}
    }
    console.log(`  Cleaned up ${createdAttachmentIds.length} test attachments (DB & disk)`);

    // 4.2 Delete test checkup for Student A (AY 2025-2026)
    await prisma.healthCheckup.deleteMany({
      where: { admissionNumber: ADM_A, academicYear: "2025-2026" },
    });
    console.log("  Cleaned up test health checkups");

    // 4.3 Delete test immunizations for Student A
    await prisma.immunization.deleteMany({
      where: { admissionNumber: ADM_A },
    });
    console.log("  Cleaned up test immunizations");

    // 4.4 Clean up test special need for Student A
    await prisma.specialNeed.deleteMany({
      where: { admissionNumber: ADM_A },
    });
    console.log("  Cleaned up test special needs");

    // 4.5 Restore Student A baseline
    await prisma.student.update({
      where: { admissionNumber: ADM_A },
      data: {
        bloodGroup: initialStudentA.bloodGroup,
        parentName: initialStudentA.parentName,
        phone: initialStudentA.phone,
        aadhaarNumber: initialStudentA.aadhaarNumber,
        address: initialStudentA.address,
        identificationMarks: initialStudentA.identificationMarks,
        emergencyContact: initialStudentA.emergencyContact,
      },
    });

    // 4.6 Restore Student B baseline
    await prisma.student.update({
      where: { admissionNumber: ADM_B },
      data: {
        bloodGroup: initialStudentB.bloodGroup,
        parentName: initialStudentB.parentName,
        phone: initialStudentB.phone,
        aadhaarNumber: initialStudentB.aadhaarNumber,
        address: initialStudentB.address,
        identificationMarks: initialStudentB.identificationMarks,
        emergencyContact: initialStudentB.emergencyContact,
      },
    });
    console.log("  Restored Student A and Student B to pristine baseline state");

    await prisma.$disconnect();
  }

  console.log("\n================================================================================");
  console.log(`  AUDIT COMPLETED: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("================================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error("Fatal audit runner error:", err);
  process.exit(1);
});
