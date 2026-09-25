/* ==========================================
   BloodLink - Mock Data Store
   Phase 1 Data Foundation
   ========================================== */

export const STATES_AND_DISTRICTS = {
  "Maharashtra": {
    "Mumbai": ["Andheri", "Bandra", "Borivali", "Dadarr", "Juhu", "Kurla", "Thane"],
    "Pune": ["Kothrud", "Viman Nagar", "Hinjawadi", "Baner", "Hadapsar", "Shivajinagar"],
    "Nagpur": ["Dharampeth", "Sadar", "Manewada", "Civil Lines"]
  },
  "Delhi": {
    "Central Delhi": ["Connaught Place", "Karol Bagh", "Paharganj"],
    "South Delhi": ["Hauz Khas", "Saket", "Greater Kailash", "Vasant Kunj"],
    "North Delhi": ["Civil Lines", "Kamla Nagar", "Model Town"]
  },
  "Karnataka": {
    "Bengaluru Urban": ["Indiranagar", "Koramangala", "HSR Layout", "Whitefield", "Jayanagar", "Electronic City"],
    "Mysuru": ["Gokulam", "Jayalakshmipuram", "Vijayanagar"]
  },
  "Tamil Nadu": {
    "Chennai": ["Anna Nagar", "T. Nagar", "Velachery", "Adyar", "Mylapore"],
    "Coimbatore": ["Gandhipuram", "RS Puram", "Peelamedu"]
  },
  "West Bengal": {
    "Kolkata": ["Salt Lake", "New Town", "Park Street", "Ballygunge", "Howrah"]
  }
};

export const MOCK_DONORS = [
  {
    id: "D-101",
    name: "Dr. Rajesh Kumar",
    gender: "Male",
    age: 34,
    bloodGroup: "O+",
    state: "Maharashtra",
    district: "Mumbai",
    area: "Andheri",
    availability: "Available Now",
    statusType: "available",
    phone: "+91 98201 45210",
    email: "rajesh.k@example.com",
    lastDonated: "4 months ago",
    totalDonations: 12
  },
  {
    id: "D-102",
    name: "Ananya Sharma",
    gender: "Female",
    age: 28,
    bloodGroup: "A+",
    state: "Maharashtra",
    district: "Mumbai",
    area: "Bandra",
    availability: "Available Now",
    statusType: "available",
    phone: "+91 98112 33445",
    email: "ananya.s@example.com",
    lastDonated: "6 months ago",
    totalDonations: 7
  },
  {
    id: "D-103",
    name: "Vikram Patil",
    gender: "Male",
    age: 41,
    bloodGroup: "B+",
    state: "Maharashtra",
    district: "Pune",
    area: "Kothrud",
    availability: "Available within 2 hrs",
    statusType: "available",
    phone: "+91 97654 88990",
    email: "vikram.p@example.com",
    lastDonated: "5 months ago",
    totalDonations: 19
  },
  {
    id: "D-104",
    name: "Priya Nair",
    gender: "Female",
    age: 26,
    bloodGroup: "AB-",
    state: "Karnataka",
    district: "Bengaluru Urban",
    area: "Indiranagar",
    availability: "Available Now",
    statusType: "available",
    phone: "+91 99001 22334",
    email: "priya.nair@example.com",
    lastDonated: "8 months ago",
    totalDonations: 4
  },
  {
    id: "D-105",
    name: "Rohan Mukherjee",
    gender: "Male",
    age: 31,
    bloodGroup: "O-",
    state: "West Bengal",
    district: "Kolkata",
    area: "Salt Lake",
    availability: "Available Now",
    statusType: "available",
    phone: "+91 98300 77889",
    email: "rohan.m@example.com",
    lastDonated: "3 months ago",
    totalDonations: 15
  },
  {
    id: "D-106",
    name: "Siddharth Verma",
    gender: "Male",
    age: 29,
    bloodGroup: "A-",
    state: "Delhi",
    district: "South Delhi",
    area: "Saket",
    availability: "Available within 4 hrs",
    statusType: "available",
    phone: "+91 98101 99887",
    email: "siddharth.v@example.com",
    lastDonated: "7 months ago",
    totalDonations: 9
  },
  {
    id: "D-107",
    name: "Kavitha Sundaram",
    gender: "Female",
    age: 35,
    bloodGroup: "B-",
    state: "Tamil Nadu",
    district: "Chennai",
    area: "T. Nagar",
    availability: "Unavailable Today",
    statusType: "busy",
    phone: "+91 94440 11223",
    email: "kavitha.s@example.com",
    lastDonated: "1 month ago",
    totalDonations: 11
  },
  {
    id: "D-108",
    name: "Amitabh Sen",
    gender: "Male",
    age: 39,
    bloodGroup: "AB+",
    state: "West Bengal",
    district: "Kolkata",
    area: "Park Street",
    availability: "Available Now",
    statusType: "available",
    phone: "+91 98311 44556",
    email: "amitabh.sen@example.com",
    lastDonated: "5 months ago",
    totalDonations: 22
  },
  {
    id: "D-109",
    name: "Meera Reddy",
    gender: "Female",
    age: 30,
    bloodGroup: "O+",
    state: "Karnataka",
    district: "Bengaluru Urban",
    area: "Koramangala",
    availability: "Available Now",
    statusType: "available",
    phone: "+91 98450 66778",
    email: "meera.reddy@example.com",
    lastDonated: "4 months ago",
    totalDonations: 8
  }
];
