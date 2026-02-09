export type OrderItem = {
  name: string;
  quantity: number;
  image: string;
};

export type VerificationEntry = {
  verifiedCount: number;
  status: string;
  verifiedBy: string;
  verifiedAt: string;
};

export type OrderVerification = {
  delivery: VerificationEntry;
  vendor: VerificationEntry;
};

export type OrderRecord = {
  id: string;
  customer: string;
  customerPhone: string;
  vendor: string;
  status: string;
  date: string;
  dueDate: string;
  itemCount: number;
  amount: string;
  rating: number;
  note: string;
  pickupPerson: string;
  deliveryPerson: string;
  deliveryType: string;
  orderItems: OrderItem[];
  verification: OrderVerification;
};

export const ORDERS: OrderRecord[] = [
  {
    id: "ORD-8291",
    customer: "Alice Freeman",
    customerPhone: "+91 98765 43210",
    vendor: "Clean Express",
    status: "Processing",
    date: "Jan 16, 2026",
    dueDate: "Today, 5:00 PM",
    itemCount: 10,
    amount: "₹450",
    rating: 4.8,
    note: "Coffee stain on front",
    pickupPerson: "John Carter",
    deliveryPerson: "John Carter",
    deliveryType: "Standard",
    orderItems: [
      {
        name: "Cotton Shirts",
        quantity: 3,
        image: "https://picsum.photos/seed/shirt1/200/200",
      },
      {
        name: "Denim Jeans",
        quantity: 2,
        image: "https://picsum.photos/seed/jeans1/200/200",
      },
    ],
    verification: {
      delivery: {
        verifiedCount: 10,
        status: "Verified",
        verifiedBy: "John Carter",
        verifiedAt: "Jan 16, 2026 • 10:45 AM",
      },
      vendor: {
        verifiedCount: 10,
        status: "Verified",
        verifiedBy: "Clean Express",
        verifiedAt: "Jan 16, 2026 • 11:30 AM",
      },
    },
  },
  {
    id: "ORD-8292",
    customer: "Mark Wilson",
    customerPhone: "+91 87654 32109",
    vendor: "Sparkle Wash",
    status: "Not Scheduled",
    date: "Jan 16, 2026",
    dueDate: "Tomorrow, 10:00 AM",
    itemCount: 2,
    amount: "₹280",
    rating: 4.5,
    note: "Oil stain on white shirt collar",
    pickupPerson: "Pending",
    deliveryPerson: "Pending",
    deliveryType: "Express 24h",
    orderItems: [
      {
        name: "Business Suit",
        quantity: 2,
        image: "https://picsum.photos/seed/suit1/200/200",
      },
    ],
    verification: {
      delivery: {
        verifiedCount: 0,
        status: "Delivery pending",
        verifiedBy: "Pending",
        verifiedAt: "Not yet verified",
      },
      vendor: {
        verifiedCount: 0,
        status: "Order not scheduled",
        verifiedBy: "Sparkle Wash",
        verifiedAt: "Awaiting items",
      },
    },
  },
  {
    id: "ORD-8293",
    customer: "Sarah Jenkins",
    customerPhone: "+91 76543 21098",
    vendor: "Fresh Laundry",
    status: "Received by Vendor",
    date: "Jan 15, 2026",
    dueDate: "Jan 16, 10:00 AM",
    itemCount: 10,
    amount: "₹620",
    rating: 4.9,
    note: "-",
    pickupPerson: "Mike Ross",
    deliveryPerson: "Mike Ross",
    deliveryType: "Standard",
    orderItems: [
      {
        name: "Mixed Load (Cotton/Synthetic)",
        quantity: 1,
        image: "https://picsum.photos/seed/laundry1/200/200",
      },
    ],
    verification: {
      delivery: {
        verifiedCount: 1,
        status: "Completed",
        verifiedBy: "Mike Ross",
        verifiedAt: "Jan 15, 2026 • 09:20 AM",
      },
      vendor: {
        verifiedCount: 1,
        status: "Verified",
        verifiedBy: "Fresh Laundry",
        verifiedAt: "Jan 15, 2026 • 09:35 AM",
      },
    },
  },
  {
    id: "ORD-8294",
    customer: "James Doe",
    customerPhone: "+91 65432 10987",
    vendor: "Quick Clean",
    status: "Picked Up",
    date: "Jan 16, 2026",
    dueDate: "Jan 16, 2:00 PM",
    itemCount: 1,
    amount: "₹380",
    rating: 5.0,
    note: "Delicate silk items",
    pickupPerson: "Rahul S",
    deliveryPerson: "Pending",
    deliveryType: "Express 48h",
    orderItems: [
      {
        name: "Wedding Dress",
        quantity: 1,
        image: "https://picsum.photos/seed/dress2/200/200",
      },
    ],
    verification: {
      delivery: {
        verifiedCount: 0,
        status: "Awaiting pickup",
        verifiedBy: "Pending",
        verifiedAt: "Not yet verified",
      },
      vendor: {
        verifiedCount: 0,
        status: "Awaiting delivery",
        verifiedBy: "Quick Clean",
        verifiedAt: "Not yet verified",
      },
    },
  },
  {
    id: "ORD-8295",
    customer: "Priya Sharma",
    customerPhone: "+91 54321 09876",
    vendor: "Clean Express",
    status: "Delivered",
    date: "Jan 15, 2026",
    dueDate: "Jan 15, 5:00 PM",
    itemCount: 3,
    amount: "₹150",
    rating: 4.7,
    note: "Color bleed risk on red dress",
    pickupPerson: "Rahul K",
    deliveryPerson: "Sam Will",
    deliveryType: "Standard",
    orderItems: [
      {
        name: "Shirts & Dress",
        quantity: 3,
        image: "https://picsum.photos/seed/dress3/200/200",
      },
    ],
    verification: {
      delivery: {
        verifiedCount: 3,
        status: "Completed",
        verifiedBy: "Sam Will",
        verifiedAt: "Jan 15, 2026 • 05:10 PM",
      },
      vendor: {
        verifiedCount: 3,
        status: "Verified",
        verifiedBy: "Clean Express",
        verifiedAt: "Jan 15, 2026 • 04:50 PM",
      },
    },
  },
  {
    id: "ORD-8296",
    customer: "Rahul Verma",
    customerPhone: "+91 43210 98765",
    vendor: "Urban Laundry",
    status: "Not Scheduled",
    date: "Jan 14, 2026",
    dueDate: "Jan 15, 4:00 PM",
    itemCount: 8,
    amount: "₹520",
    rating: 4.5,
    note: "Grass stains on knees",
    pickupPerson: "Pending",
    deliveryPerson: "Pending",
    deliveryType: "Express 24h",
    orderItems: [
      {
        name: "8kg Wash & Iron",
        quantity: 8,
        image: "https://picsum.photos/seed/jeans2/200/200",
      },
    ],
    verification: {
      delivery: {
        verifiedCount: 0,
        status: "Delivery pending",
        verifiedBy: "Pending",
        verifiedAt: "Not yet verified",
      },
      vendor: {
        verifiedCount: 0,
        status: "Awaiting pickup",
        verifiedBy: "Urban Laundry",
        verifiedAt: "Not yet verified",
      },
    },
  },
];
