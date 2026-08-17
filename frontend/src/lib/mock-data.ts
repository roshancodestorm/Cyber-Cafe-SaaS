// Isolated Mock Data for Landing Page

export const NEARBY_CAFES = [
  { id: 1, name: "Nexus Esports Arena", distance: "0.8 miles", status: "Open Now", availablePCs: 12, rating: 4.8 },
  { id: 2, name: "Cyber Hub Downtown", distance: "1.2 miles", status: "Open Now", availablePCs: 5, rating: 4.5 },
  { id: 3, name: "Pixel Lounge", distance: "3.5 miles", status: "Closed", availablePCs: 0, rating: 4.9 },
  { id: 4, name: "Gamer's Paradise", distance: "4.1 miles", status: "Open Now", availablePCs: 22, rating: 4.7 },
];

export const PRICING_PLANS = [
  {
    name: "Starter",
    price: "$29",
    description: "Perfect for small cafes with up to 20 PCs.",
    features: ["Up to 20 PC terminals", "Basic Billing & Reports", "Standard Support", "1 Admin Account"],
  },
  {
    name: "Pro",
    price: "$79",
    description: "For growing businesses demanding more control.",
    features: ["Up to 100 PC terminals", "Advanced Analytics", "Cloud Printing Module", "Priority Support", "5 Admin Accounts"],
    isPopular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large esports arenas and franchises.",
    features: ["Unlimited PC terminals", "AI Assistant Module", "Custom Branding", "24/7 Phone Support", "Dedicated Account Manager"],
  },
];

export const FAQS = [
  {
    question: "Is this compatible with diskless (PXE) setups?",
    answer: "Yes, our platform is fully compatible with popular diskless booting systems like CCBoot and SENET, integrating seamlessly for game updates and billing.",
  },
  {
    question: "How does the cloud printing feature work?",
    answer: "Our secure cloud printing module acts as a virtual printer on the client PCs. When a user prints, the job is sent to your admin dashboard where you can approve it, or users can securely release it using a temporary access PIN.",
  },
  {
    question: "Can I manage multiple cafe locations?",
    answer: "Absolutely. The Pro and Enterprise plans allow you to link multiple locations under a single management dashboard, sharing user accounts and loyalty points across branches.",
  },
  {
    question: "How does the temporary access feature work?",
    answer: "You can generate auto-expiring access links or QR codes for guests. Once the predefined time or usage limit is reached, their session is automatically terminated and their local footprint is wiped.",
  },
];

export const FEATURES = [
  {
    title: "Smart Billing",
    description: "Flexible prepaid, postpaid, and membership billing systems with multiple payment gateways.",
    iconName: "CreditCard",
  },
  {
    title: "Game Management",
    description: "Centralized game updates, license management, and automatic categorization.",
    iconName: "Gamepad2",
  },
  {
    title: "Analytics Dashboard",
    description: "Detailed insights into peak hours, revenue, and customer retention metrics.",
    iconName: "BarChart3",
  },
  {
    title: "Network Control",
    description: "Bandwidth shaping, website filtering, and seamless network monitoring.",
    iconName: "Wifi",
  },
  {
    title: "Mobile App for Users",
    description: "Customers can top up, check balance, and book PCs directly from their phones.",
    iconName: "Smartphone",
  },
  {
    title: "Enterprise Security",
    description: "Deep freeze functionality, anti-cheat enforcement, and ransomware protection.",
    iconName: "Shield",
  },
];
