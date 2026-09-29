const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const INITIAL_HOSPITALS = [
  {
    id: "hosp-1",
    name: "D. Y. Patil Medical College & Hospital",
    code: "DYP-PIMPRI",
    address: "Sant Tukaram Nagar, Pimpri, Pune 411018",
    latitude: 18.6258,
    longitude: 73.8202,
    generalBedsTotal: 80,
    generalBedsAvailable: 18,
    icuBedsTotal: 24,
    icuBedsAvailable: 5,
    specialties: JSON.stringify(["Cardiology", "Trauma Bay", "Neurology", "Burn Unit", "Pediatrics"]),
    bloodBankStatus: "Optimal",
    o2SupplyPercent: 96,
    traumaLevel: 1,
    lastUpdated: new Date(Date.now() - 45 * 1000) // 45 seconds ago
  },
  {
    id: "hosp-2",
    name: "Aditya Birla Memorial Hospital",
    code: "ABM-CHINCHWAD",
    address: "Aditya Birla Hospital Marg, Chinchwad, Pune 411033",
    latitude: 18.6298,
    longitude: 73.7820,
    generalBedsTotal: 120,
    generalBedsAvailable: 28,
    icuBedsTotal: 30,
    icuBedsAvailable: 7,
    specialties: JSON.stringify(["Cardiology", "Trauma Bay", "Neurology", "Cath Lab", "Ventilator", "Organ Transplant"]),
    bloodBankStatus: "Optimal",
    o2SupplyPercent: 99,
    traumaLevel: 1,
    lastUpdated: new Date(Date.now() - 25 * 1000) // 25 seconds ago
  },
  {
    id: "hosp-3",
    name: "YCM Municipal Teaching Hospital",
    code: "YCM-PIMPRI",
    address: "Sant Tukaram Nagar, Pimpri Colony, Pune 411018",
    latitude: 18.6272,
    longitude: 73.8131,
    generalBedsTotal: 150,
    generalBedsAvailable: 14,
    icuBedsTotal: 25,
    icuBedsAvailable: 2,
    specialties: JSON.stringify(["General Emergency", "Trauma Bay", "Respiratory Distress", "Ventilator"]),
    bloodBankStatus: "Moderate",
    o2SupplyPercent: 88,
    traumaLevel: 2,
    lastUpdated: new Date(Date.now() - 110 * 1000) // ~2 minutes ago
  },
  {
    id: "hosp-4",
    name: "Lokmanya Hospital (Trauma & Ortho)",
    code: "LOK-NIGDI",
    address: "Sector 24, Pradhikaran, Nigdi, Pimpri-Chinchwad 411044",
    latitude: 18.6473,
    longitude: 73.7661,
    generalBedsTotal: 45,
    generalBedsAvailable: 9,
    icuBedsTotal: 12,
    icuBedsAvailable: 1, // Crucial for double-booking test
    specialties: JSON.stringify(["Trauma Bay", "Ortho Surgery", "ICU Bed", "Ventilator"]),
    bloodBankStatus: "Moderate",
    o2SupplyPercent: 92,
    traumaLevel: 2,
    lastUpdated: new Date(Date.now() - 60 * 1000) // 1 min ago
  },
  {
    id: "hosp-5",
    name: "Star Hospital & Emergency Care",
    code: "STR-AKURDI",
    address: "Old Mumbai-Pune Highway, Akurdi, Pune 411035",
    latitude: 18.6499,
    longitude: 73.7707,
    generalBedsTotal: 35,
    generalBedsAvailable: 12,
    icuBedsTotal: 8,
    icuBedsAvailable: 3,
    specialties: JSON.stringify(["General Emergency", "ICU Bed", "Respiratory Distress"]),
    bloodBankStatus: "Critical",
    o2SupplyPercent: 78,
    traumaLevel: 3,
    lastUpdated: new Date(Date.now() - 3200 * 1000) // 53 minutes ago (Stale candidate)
  },
  {
    id: "hosp-6",
    name: "Jupiter Hospital Baner",
    code: "JUP-BANER",
    address: "Near Prathamesh Park, Baner, Pune 411045",
    latitude: 18.5590,
    longitude: 73.7788,
    generalBedsTotal: 90,
    generalBedsAvailable: 31,
    icuBedsTotal: 20,
    icuBedsAvailable: 8,
    specialties: JSON.stringify(["Cardiology", "Cath Lab", "Trauma Bay", "Neurology", "Ventilator"]),
    bloodBankStatus: "Optimal",
    o2SupplyPercent: 98,
    traumaLevel: 1,
    lastUpdated: new Date(Date.now() - 35 * 1000) // 35 seconds ago
  },
  {
    id: "hosp-7",
    name: "Ruby Hall Clinic Hinjawadi",
    code: "RHC-HINJAWADI",
    address: "Rajiv Gandhi Infotech Park, Hinjawadi Phase 1, Pune 411057",
    latitude: 18.5912,
    longitude: 73.7389,
    generalBedsTotal: 65,
    generalBedsAvailable: 19,
    icuBedsTotal: 16,
    icuBedsAvailable: 4,
    specialties: JSON.stringify(["Cardiology", "Neurology", "Burn Unit", "Ventilator"]),
    bloodBankStatus: "Optimal",
    o2SupplyPercent: 94,
    traumaLevel: 1,
    lastUpdated: new Date(Date.now() - 75 * 1000) // 75 seconds ago
  },
  {
    id: "hosp-8",
    name: "Sahyadri Super Speciality Hospital",
    code: "SYH-DECCAN",
    address: "Plot No. 30-C, Erandwane, Karve Road, Deccan, Pune 411004",
    latitude: 18.5135,
    longitude: 73.8329,
    generalBedsTotal: 100,
    generalBedsAvailable: 22,
    icuBedsTotal: 22,
    icuBedsAvailable: 6,
    specialties: JSON.stringify(["Cardiology", "Neurology", "Trauma Bay", "Cath Lab", "Organ Transplant"]),
    bloodBankStatus: "Optimal",
    o2SupplyPercent: 95,
    traumaLevel: 1,
    lastUpdated: new Date(Date.now() - 150 * 1000) // 2.5 mins ago
  }
];

async function seed() {
  console.log("Clearing existing records...");
  await prisma.auditLog.deleteMany({});
  await prisma.emergencyRequest.deleteMany({});
  await prisma.hospital.deleteMany({});

  console.log("Seeding hospitals...");
  for (const hosp of INITIAL_HOSPITALS) {
    await prisma.hospital.create({ data: hosp });
  }

  // Create an initial active request for demo purposes
  const initialReq = await prisma.emergencyRequest.create({
    data: {
      incidentNumber: "INC-911-0401",
      callerName: "Paramedic Dispatch 108 - Sector 26",
      patientAge: 58,
      patientGender: "Male",
      emergencyType: "Acute Myocardial Infarction (AMI)",
      urgencyLevel: "Immediate",
      requiredResourceType: "ICU Bed",
      requiresBlood: true,
      bloodTypeNeeded: "O+",
      latitude: 18.6508, // Near PCCOE Campus / Nigdi Pradhikaran
      longitude: 73.7629,
      assignedHospitalId: "hosp-2",
      status: "ACCEPTED",
      bedReserved: true,
      scoreSnapshot: JSON.stringify({
        rank: 1,
        totalScore: 92.4,
        distanceScore: 84.1,
        matchScore: 98.0,
        freshnessScore: 95.0,
        mlProbability: 0.94
      }),
      handoffNotes: "Patient stabilized with dual antiplatelet therapy. ETA 8 minutes. Cath lab prep requested."
    }
  });

  await prisma.auditLog.create({
    data: {
      eventType: "DISPATCH_ACCEPTED",
      hospitalId: "hosp-2",
      requestId: initialReq.id,
      incidentNumber: initialReq.incidentNumber,
      details: "Aditya Birla Memorial accepted INC-911-0401. ICU Bed #4 reserved atomically."
    }
  });

  console.log(`Seeded ${INITIAL_HOSPITALS.length} hospitals and initial active emergency dispatch.`);
}

if (require.main === module) {
  seed()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { INITIAL_HOSPITALS, seed };
