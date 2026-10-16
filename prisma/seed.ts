import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Confirmed in the owner's discovery brief (§3). Sort order matches the
// order they were listed in.
const weddingTypes = [
  { name: "Traditional Weddings", slug: "traditional", sortOrder: 0 },
  { name: "Large-Scale Weddings", slug: "large-scale", sortOrder: 1 },
  { name: "Intimate Weddings", slug: "intimate", sortOrder: 2 },
  { name: "Other Wedding Types", slug: "other", sortOrder: 3 },
];

// Proposed organizational groupings only — NOT confirmed by the owner.
// Purely for grouping the service catalogue in the UI; pending approval.
const serviceCategories = [
  { name: "Planning", slug: "planning", sortOrder: 0 },
  { name: "Coordination", slug: "coordination", sortOrder: 1 },
  { name: "Venue", slug: "venue", sortOrder: 2 },
  { name: "Vendor Management", slug: "vendor-management", sortOrder: 3 },
  { name: "Logistics", slug: "logistics", sortOrder: 4 },
  { name: "Event Design", slug: "event-design", sortOrder: 5 },
  { name: "Guest Experience", slug: "guest-experience", sortOrder: 6 },
  { name: "On-the-Day Coordination", slug: "on-the-day-coordination", sortOrder: 7 },
];

// Confirmed offered wedding services (owner's brief §3), grouped under the
// proposed categories above.
const activeServices: { name: string; slug: string; category: string; sortOrder: number }[] = [
  { name: "Full Wedding Planning", slug: "full-wedding-planning", category: "planning", sortOrder: 0 },
  { name: "Partial Planning", slug: "partial-planning", category: "planning", sortOrder: 1 },
  { name: "Design/Concept", slug: "design-concept", category: "planning", sortOrder: 2 },
  { name: "Budget Management", slug: "budget-management", category: "planning", sortOrder: 3 },
  { name: "Day-of Coordination", slug: "day-of-coordination", category: "coordination", sortOrder: 0 },
  { name: "Venue Sourcing", slug: "venue-sourcing", category: "venue", sortOrder: 0 },
  { name: "Destination Weddings", slug: "destination-weddings", category: "venue", sortOrder: 1 },
  { name: "Vendor Management", slug: "vendor-management-service", category: "vendor-management", sortOrder: 0 },
  { name: "Catering Coordination", slug: "catering-coordination", category: "vendor-management", sortOrder: 1 },
  { name: "Wedding Cake", slug: "wedding-cake", category: "vendor-management", sortOrder: 2 },
  { name: "Transportation", slug: "transportation", category: "logistics", sortOrder: 0 },
  { name: "Honeymoon/Travel Coordination", slug: "honeymoon-travel-coordination", category: "logistics", sortOrder: 1 },
  { name: "Décor", slug: "decor", category: "event-design", sortOrder: 0 },
  { name: "Guest Management", slug: "guest-management", category: "guest-experience", sortOrder: 0 },
  { name: "Invitations/Stationery", slug: "invitations-stationery", category: "guest-experience", sortOrder: 1 },
  { name: "Photography", slug: "photography", category: "on-the-day-coordination", sortOrder: 0 },
  { name: "Videography", slug: "videography", category: "on-the-day-coordination", sortOrder: 1 },
  { name: "Entertainment", slug: "entertainment", category: "on-the-day-coordination", sortOrder: 2 },
];

// Explicitly excluded by the owner (brief §3) — kept as inactive rows rather
// than deleted, so they can be re-activated from the admin side later.
const inactiveServices = [
  { name: "Accommodation", slug: "accommodation" },
  { name: "Floral Design", slug: "floral-design" },
];

// Confirmed offered Party & Social Event services (owner said "All" in the
// brief) — uncategorized, since no groupings were proposed for this
// division. Slugs are prefixed to stay unique alongside Wedding's/
// Corporate's same-named services (e.g. "Photography" exists in all three).
const partyServices = [
  "Event Planning",
  "Event Design",
  "Venue Sourcing",
  "Décor",
  "Catering",
  "Entertainment",
  "DJ",
  "Live Music",
  "Photography",
  "Videography",
  "Lighting",
  "Sound",
  "Furniture",
  "Tents",
  "Transportation",
  "Guest Management",
].map((name, i) => ({
  name,
  slug: `party-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`,
  sortOrder: i,
}));

// Confirmed offered Corporate Event services (owner said "All" in the
// brief) — uncategorized, same reasoning as Party above. Note Accommodation
// IS offered for Corporate (unlike Weddings, where it's explicitly excluded).
const corporateServices = [
  "Event Planning",
  "Venue Sourcing",
  "Event Design",
  "Décor",
  "Catering",
  "AV Production",
  "Stage Design",
  "Photography",
  "Videography",
  "Entertainment",
  "Guest Registration",
  "Transportation",
  "Accommodation",
  "Branding/Signage",
  "Event Staffing",
].map((name, i) => ({
  name,
  slug: `corporate-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`,
  sortOrder: i,
}));

async function main() {
  for (const wt of weddingTypes) {
    await prisma.weddingType.upsert({
      where: { slug: wt.slug },
      update: { name: wt.name, sortOrder: wt.sortOrder },
      create: wt,
    });
  }

  const categoryIdBySlug = new Map<string, string>();
  for (const cat of serviceCategories) {
    const row = await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder },
      create: cat,
    });
    categoryIdBySlug.set(cat.slug, row.id);
  }

  for (const svc of activeServices) {
    await prisma.service.upsert({
      where: { slug: svc.slug },
      update: {
        name: svc.name,
        categoryId: categoryIdBySlug.get(svc.category),
        sortOrder: svc.sortOrder,
        isActive: true,
      },
      create: {
        name: svc.name,
        slug: svc.slug,
        categoryId: categoryIdBySlug.get(svc.category),
        sortOrder: svc.sortOrder,
        division: "WEDDING",
        isActive: true,
      },
    });
  }

  for (const svc of inactiveServices) {
    await prisma.service.upsert({
      where: { slug: svc.slug },
      update: { name: svc.name, isActive: false, inactiveNote: "Not currently offered" },
      create: {
        name: svc.name,
        slug: svc.slug,
        division: "WEDDING",
        isActive: false,
        inactiveNote: "Not currently offered",
      },
    });
  }

  for (const svc of partyServices) {
    await prisma.service.upsert({
      where: { slug: svc.slug },
      update: { name: svc.name, sortOrder: svc.sortOrder, isActive: true },
      create: { name: svc.name, slug: svc.slug, sortOrder: svc.sortOrder, division: "PARTY", isActive: true },
    });
  }

  for (const svc of corporateServices) {
    await prisma.service.upsert({
      where: { slug: svc.slug },
      update: { name: svc.name, sortOrder: svc.sortOrder, isActive: true },
      create: { name: svc.name, slug: svc.slug, sortOrder: svc.sortOrder, division: "CORPORATE", isActive: true },
    });
  }

  const totalServices =
    activeServices.length + inactiveServices.length + partyServices.length + corporateServices.length;
  console.log(
    `Seeded ${weddingTypes.length} wedding types, ${serviceCategories.length} categories, ${totalServices} services (Wedding/Party/Corporate).`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
