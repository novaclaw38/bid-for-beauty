import "dotenv/config";
import { desc } from "drizzle-orm";
import { db } from "./index";
import { bids, jobs, sessions, users } from "./schema";
import { hashPassword } from "../lib/password";

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const now = Date.now();

function ago(days: number, hours = 0): Date {
  return new Date(now - days * DAY - hours * HOUR);
}
function inFuture(days: number, hours = 0): Date {
  return new Date(now + days * DAY + hours * HOUR);
}

async function main() {
  console.log("Clearing existing data…");
  await db.delete(bids);
  await db.delete(jobs);
  await db.delete(sessions);
  await db.delete(users);

  const demoPassword = hashPassword("demo1234");

  console.log("Seeding users…");
  const [ava, rachel, danielle, morgan, natalie, simone, grace, vanessa] =
    await db
      .insert(users)
      .values([
        {
          role: "client" as const,
          name: "Ava Whitfield",
          email: "ava@glossdemo.com",
          passwordHash: demoPassword,
          bio: "Planning a September wedding and always testing new looks.",
          location: "Melville",
          avatarHue: 14,
        },
        {
          role: "client" as const,
          name: "Rachel Kim",
          email: "rachel@glossdemo.com",
          passwordHash: demoPassword,
          bio: "Product designer. Nail art enthusiast.",
          location: "Rosebank",
          avatarHue: 210,
        },
        {
          role: "client" as const,
          name: "Danielle Carter",
          email: "danielle@glossdemo.com",
          passwordHash: demoPassword,
          bio: "Runner, mom of two, protective-style loyalist.",
          location: "Midrand",
          avatarHue: 150,
        },
        {
          role: "client" as const,
          name: "Morgan Blake",
          email: "morgan@glossdemo.com",
          passwordHash: demoPassword,
          bio: "Startup founder. Minimal time, maximal grooming standards.",
          location: "Braamfontein",
          avatarHue: 230,
        },
        {
          role: "client" as const,
          name: "Natalie Foster",
          email: "natalie@glossdemo.com",
          passwordHash: demoPassword,
          bio: "Skincare is my personality at this point.",
          location: "Linden",
          avatarHue: 95,
        },
        {
          role: "client" as const,
          name: "Simone Davis",
          email: "simone@glossdemo.com",
          passwordHash: demoPassword,
          bio: "Natural hair journey since 2019.",
          location: "Greenside",
          avatarHue: 265,
        },
        {
          role: "client" as const,
          name: "Grace O'Malley",
          email: "grace@glossdemo.com",
          passwordHash: demoPassword,
          bio: "Marathon training = constant need for bodywork.",
          location: "Parktown North",
          avatarHue: 340,
        },
        {
          role: "client" as const,
          name: "Vanessa Ortiz",
          email: "vanessa@glossdemo.com",
          passwordHash: demoPassword,
          bio: "Lash girl forever.",
          location: "Parkhurst",
          avatarHue: 45,
        },
      ])
      .returning();

  const [amara, sofia, jade, elena, maya, tiana, marcus, priya, chloe, isabella] =
    await db
      .insert(users)
      .values([
        {
          role: "professional" as const,
          name: "Amara Okafor",
          email: "amara@glossdemo.com",
          passwordHash: demoPassword,
          bio: "Braider & natural hair specialist with 9 years behind the chair. Silk press queen, knotless authority.",
          location: "Randburg, Johannesburg",
          specialties: ["hair"],
          rating: "4.9",
          jobsCompleted: 214,
          avatarHue: 20,
        },
        {
          role: "professional" as const,
          name: "Sofia Marino",
          email: "sofia@glossdemo.com",
          passwordHash: demoPassword,
          bio: "Gel-X and hand-painted nail art. Former editorial nail tech for fashion week.",
          location: "Fourways, Johannesburg",
          specialties: ["nails"],
          rating: "4.8",
          jobsCompleted: 167,
          avatarHue: 335,
        },
        {
          role: "professional" as const,
          name: "Jade Nguyen",
          email: "jade@glossdemo.com",
          passwordHash: demoPassword,
          bio: "Makeup artist for editorial, bridal, and camera-ready glam. Kit is 100% cruelty-free.",
          location: "Rosebank, Johannesburg",
          specialties: ["makeup"],
          rating: "4.9",
          jobsCompleted: 188,
          avatarHue: 290,
        },
        {
          role: "professional" as const,
          name: "Elena Petrova",
          email: "elena@glossdemo.com",
          passwordHash: demoPassword,
          bio: "Licensed esthetician. Hydrafacial certified, dermaplaning, and barrier-repair focused treatments.",
          location: "Houghton, Johannesburg",
          specialties: ["skincare"],
          rating: "4.7",
          jobsCompleted: 143,
          avatarHue: 110,
        },
        {
          role: "professional" as const,
          name: "Maya Lindqvist",
          email: "maya@glossdemo.com",
          passwordHash: demoPassword,
          bio: "Licensed massage therapist. Deep tissue, sports recovery, and prenatal. I bring the table to you.",
          location: "Melville, Johannesburg",
          specialties: ["massage"],
          rating: "4.8",
          jobsCompleted: 201,
          avatarHue: 185,
        },
        {
          role: "professional" as const,
          name: "Tiana Brooks",
          email: "tiana@glossdemo.com",
          passwordHash: demoPassword,
          bio: "Lash artist & microblading tech. Wake-up-ready faces since 2018.",
          location: "Soweto, Johannesburg",
          specialties: ["brows-lashes"],
          rating: "4.9",
          jobsCompleted: 176,
          avatarHue: 40,
        },
        {
          role: "professional" as const,
          name: "Marcus Cole",
          email: "marcus@glossdemo.com",
          passwordHash: demoPassword,
          bio: "Master barber. Fades, beard sculpting, and hot towel finishes. House calls across the city.",
          location: "Bryanston, Johannesburg",
          specialties: ["barbering"],
          rating: "4.8",
          jobsCompleted: 232,
          avatarHue: 220,
        },
        {
          role: "professional" as const,
          name: "Priya Raghavan",
          email: "priya@glossdemo.com",
          passwordHash: demoPassword,
          bio: "Hair & makeup duo for South Asian and fusion weddings. 60+ bridal parties glamified.",
          location: "Midrand, Gauteng",
          specialties: ["hair", "makeup"],
          rating: "4.6",
          jobsCompleted: 98,
          avatarHue: 305,
        },
        {
          role: "professional" as const,
          name: "Chloe Fontaine",
          email: "chloe@glossdemo.com",
          passwordHash: demoPassword,
          bio: "BIAB & structured manicures. Nail health first, art second — actually, both first.",
          location: "Parkhurst, Johannesburg",
          specialties: ["nails"],
          rating: "4.7",
          jobsCompleted: 121,
          avatarHue: 350,
        },
        {
          role: "professional" as const,
          name: "Isabella Reyes",
          email: "isabella@glossdemo.com",
          passwordHash: demoPassword,
          bio: "Holistic esthetician & massage therapist. Gua sha, lymphatic drainage, and calm energy.",
          location: "Emmarentia, Johannesburg",
          specialties: ["skincare", "massage"],
          rating: "4.8",
          jobsCompleted: 154,
          avatarHue: 160,
        },
      ])
      .returning();

  const proByEmail = Object.fromEntries(
    [amara, sofia, jade, elena, maya, tiana, marcus, priya, chloe, isabella].map(
      (u) => [u.email.split("@")[0], u],
    ),
  );

  console.log("Seeding jobs…");
  type JobSeed = {
    clientId: string;
    title: string;
    description: string;
    category: string;
    budgetMin: number;
    budgetMax: number;
    location: string;
    preferredDate: Date;
    status: "open" | "awarded" | "completed" | "cancelled";
    createdAt: Date;
  };

  const jobSeeds: JobSeed[] = [
    {
      clientId: ava.id,
      title: "Bridal updo for bride + 4 bridesmaids",
      description:
        "September wedding at a loft venue in Maboneng. I want a soft, romantic low bun for me and coordinated textured updos for my four bridesmaids (mixed hair types: 2A, 3B, 3C, 4A, 4C). Trial run preferred a week before. We'll be getting ready on-site from 8am.",
      category: "hair",
      budgetMin: 5700,
      budgetMax: 9750,
      location: "Maboneng, Johannesburg",
      preferredDate: inFuture(21),
      status: "open",
      createdAt: ago(0, 6),
    },
    {
      clientId: rachel.id,
      title: "Gel-X full set with chrome art",
      description:
        "Medium almond Gel-X extensions with a chrome/glazed finish and a couple of hand-painted accents. I have reference photos ready. Prefer an evening slot after 6pm if possible.",
      category: "nails",
      budgetMin: 1275,
      budgetMax: 2100,
      location: "Rosebank, Johannesburg",
      preferredDate: inFuture(4),
      status: "open",
      createdAt: ago(1, 3),
    },
    {
      clientId: morgan.id,
      title: "Editorial glam for portfolio shoot",
      description:
        "Studio photoshoot for my founder portfolio — two looks (clean corporate + bold editorial). Shoot runs 3 hours in Braamfontein. Need camera-proof skin and someone comfortable making touch-ups between setups.",
      category: "makeup",
      budgetMin: 2250,
      budgetMax: 3900,
      location: "Braamfontein, Johannesburg",
      preferredDate: inFuture(2),
      status: "awarded",
      createdAt: ago(4, 5),
    },
    {
      clientId: grace.id,
      title: "90-min deep tissue at home, weekly",
      description:
        "Marathon training is wrecking my calves and hips. Looking for a therapist who can do weekly 90-minute deep tissue sessions at my apartment, Sunday evenings preferred. Recurring booking for the right fit.",
      category: "massage",
      budgetMin: 1950,
      budgetMax: 2850,
      location: "Parktown North, Johannesburg",
      preferredDate: inFuture(5),
      status: "open",
      createdAt: ago(0, 2),
    },
    {
      clientId: simone.id,
      title: "Silk press + trim for natural hair",
      description:
        "4B/4C natural, shoulder length. Want a silk press with a light dusting trim — no big chop. Heat protectant is a must, and I'd love tips on making it last.",
      category: "hair",
      budgetMin: 1350,
      budgetMax: 2250,
      location: "Greenside, Johannesburg",
      preferredDate: ago(3),
      status: "completed",
      createdAt: ago(9, 7),
    },
    {
      clientId: vanessa.id,
      title: "Volume lash extensions, full set",
      description:
        "Full volume set, D-curl, cat-eye map. I'm a side sleeper so retention matters — looking for an artist whose work genuinely lasts 3+ weeks.",
      category: "brows-lashes",
      budgetMin: 1950,
      budgetMax: 3000,
      location: "Parkhurst, Johannesburg",
      preferredDate: inFuture(3),
      status: "open",
      createdAt: ago(2, 4),
    },
    {
      clientId: morgan.id,
      title: "Skin fade + beard sculpt, house call",
      description:
        "Mid skin fade, beard lineup and hot towel finish at my place before a board meeting week. Clippers-only on top, keeping length. Early morning slot (7am) strongly preferred.",
      category: "barbering",
      budgetMin: 900,
      budgetMax: 1425,
      location: "Braamfontein, Johannesburg",
      preferredDate: inFuture(1),
      status: "awarded",
      createdAt: ago(3, 8),
    },
    {
      clientId: natalie.id,
      title: "Hydrafacial + dermaplaning session",
      description:
        "First time combining both. My skin is dehydrated with some congestion around the T-zone. Looking for a licensed esthetician who can walk me through aftercare.",
      category: "skincare",
      budgetMin: 2100,
      budgetMax: 3300,
      location: "Linden, Johannesburg",
      preferredDate: inFuture(6),
      status: "open",
      createdAt: ago(1, 9),
    },
    {
      clientId: ava.id,
      title: "Wedding makeup trial + day-of",
      description:
        "Natural-glam bridal makeup with a trial beforehand. I cry easily, so waterproof everything. Day-of application at the venue (Maboneng) starting 9am, ceremony at 4pm — possible touch-up kit add-on.",
      category: "makeup",
      budgetMin: 4800,
      budgetMax: 8250,
      location: "Maboneng, Johannesburg",
      preferredDate: inFuture(20),
      status: "open",
      createdAt: ago(3, 2),
    },
    {
      clientId: simone.id,
      title: "Acrylic removal + BIAB overlay",
      description:
        "Soak off my current acrylics (they've grown out 4 weeks) and rebuild with a BIAB overlay in a sheer nude. My natural nails need rehab, not another harsh set.",
      category: "nails",
      budgetMin: 1050,
      budgetMax: 1800,
      location: "Greenside, Johannesburg",
      preferredDate: inFuture(2),
      status: "open",
      createdAt: ago(0, 11),
    },
    {
      clientId: danielle.id,
      title: "Knotless box braids, waist length",
      description:
        "Small knotless box braids, waist length, in a natural black. I have a sensitive scalp so no tight tension. Can provide the hair or add it to the quote — your call.",
      category: "hair",
      budgetMin: 3000,
      budgetMax: 5100,
      location: "Midrand, Gauteng",
      preferredDate: inFuture(7),
      status: "awarded",
      createdAt: ago(6, 4),
    },
    {
      clientId: grace.id,
      title: "Couples massage for our anniversary",
      description:
        "Two 60-minute massages back-to-back at our apartment for a low-key anniversary evening. Relaxation-focused, medium pressure. Table(s) and setup need to be provided by the therapist.",
      category: "massage",
      budgetMin: 3300,
      budgetMax: 5100,
      location: "Parktown North, Johannesburg",
      preferredDate: ago(6),
      status: "completed",
      createdAt: ago(12, 6),
    },
    {
      clientId: rachel.id,
      title: "Microblading touch-up (6-month)",
      description:
        "My initial microblading from February needs its refresh. Same artist moved to Cape Town, so I need someone new who's comfortable working over existing pigment. Photos available.",
      category: "brows-lashes",
      budgetMin: 2250,
      budgetMax: 3900,
      location: "Rosebank, Johannesburg",
      preferredDate: inFuture(8),
      status: "open",
      createdAt: ago(5, 1),
    },
    {
      clientId: vanessa.id,
      title: "Monthly facial membership trial",
      description:
        "Looking for an esthetician open to a monthly recurring facial arrangement at a flat rate. Pausing this for now — reposting next season when my schedule settles.",
      category: "skincare",
      budgetMin: 1500,
      budgetMax: 2400,
      location: "Parkhurst, Johannesburg",
      preferredDate: inFuture(10),
      status: "cancelled",
      createdAt: ago(8, 3),
    },
    {
      clientId: danielle.id,
      title: "Haircuts for my two boys (5 and 8)",
      description:
        "Both need back-to-school cuts — one wants a taper, the other just a clean-up. House call would be amazing since getting them to a shop is chaos. Saturday morning preferred.",
      category: "barbering",
      budgetMin: 750,
      budgetMax: 1350,
      location: "Midrand, Gauteng",
      preferredDate: inFuture(4),
      status: "open",
      createdAt: ago(0, 4),
    },
  ];

  const insertedJobs = await db.insert(jobs).values(jobSeeds).returning();
  const jobByTitle = Object.fromEntries(insertedJobs.map((j) => [j.title, j]));

  console.log("Seeding bids…");
  type BidSeed = {
    jobTitle: string;
    proEmail: string;
    amount: number;
    message: string;
    status: "pending" | "accepted" | "declined" | "withdrawn";
    hoursAfterJob: number;
  };

  const bidSeeds: BidSeed[] = [
    // Bridal updo (open)
    {
      jobTitle: "Bridal updo for bride + 4 bridesmaids",
      proEmail: "amara",
      amount: 8775,
      hoursAfterJob: 2,
      status: "pending",
      message:
        "Congratulations! I've done 40+ bridal parties and work across all textures — 4C included, no upcharge surprises. Quote covers trial + day-of for all five, and I'll bring an assistant so we're done by 11am.",
    },
    {
      jobTitle: "Bridal updo for bride + 4 bridesmaids",
      proEmail: "priya",
      amount: 9300,
      hoursAfterJob: 4,
      status: "pending",
      message:
        "Hi Ava — bridal hair is my bread and butter (60+ parties, including mixed-texture parties like yours). Price includes the trial, travel to Maboneng, and a touch-up kit for you.",
    },
    {
      jobTitle: "Bridal updo for bride + 4 bridesmaids",
      proEmail: "jade",
      amount: 8100,
      hoursAfterJob: 5,
      status: "pending",
      message:
        "I primarily do makeup but regularly style for shoots and weddings. I could do a soft glam + hair bundle with your makeup post and save you on both — happy to share my bridal portfolio.",
    },
    // Gel-X (open)
    {
      jobTitle: "Gel-X full set with chrome art",
      proEmail: "sofia",
      amount: 1875,
      hoursAfterJob: 3,
      status: "pending",
      message:
        "Glazed chrome is literally my signature — I did the chrome looks for two SA Fashion Week shows this year. Evening slots are no problem, I keep Tuesdays and Thursdays open late.",
    },
    {
      jobTitle: "Gel-X full set with chrome art",
      proEmail: "chloe",
      amount: 1650,
      hoursAfterJob: 6,
      status: "pending",
      message:
        "Hi Rachel! Medium almond Gel-X with a glazed finish is a 2-hour appointment at my Parkhurst studio. Send the reference photos and I'll confirm the design before you book.",
    },
    // Editorial glam (awarded to jade)
    {
      jobTitle: "Editorial glam for portfolio shoot",
      proEmail: "jade",
      amount: 3525,
      hoursAfterJob: 5,
      status: "accepted",
      message:
        "This is my favorite kind of brief. I'll stay the full shoot for touch-ups, prep both looks in advance with mood boards, and my kit is camera-tested under studio strobes.",
    },
    {
      jobTitle: "Editorial glam for portfolio shoot",
      proEmail: "priya",
      amount: 3750,
      hoursAfterJob: 8,
      status: "declined",
      message:
        "I do editorial work regularly and can flip between clean and bold fast. Includes lashes and HD setting for both looks.",
    },
    {
      jobTitle: "Editorial glam for portfolio shoot",
      proEmail: "chloe",
      amount: 2850,
      hoursAfterJob: 10,
      status: "declined",
      message:
        "Offering since I occasionally assist MUAs on set — I could cover the corporate look at a lower rate if budget is tight.",
    },
    // Deep tissue (open)
    {
      jobTitle: "90-min deep tissue at home, weekly",
      proEmail: "maya",
      amount: 2625,
      hoursAfterJob: 1,
      status: "pending",
      message:
        "Sports recovery is my specialty — I work with three marathoners on the same Sunday evening rotation. Table, sheets, and oils all included; I'd love to set you up recurring.",
    },
    {
      jobTitle: "90-min deep tissue at home, weekly",
      proEmail: "isabella",
      amount: 2475,
      hoursAfterJob: 3,
      status: "pending",
      message:
        "Hi Grace, I combine deep tissue with cupping for runners — great for calf and hip tightness. Rate is per session, with a discount if you book a 6-pack upfront.",
    },
    {
      jobTitle: "90-min deep tissue at home, weekly",
      proEmail: "marcus",
      amount: 2250,
      hoursAfterJob: 6,
      status: "pending",
      message:
        "Not my main lane but I've done sports massage for years — placing a lower bid in case the specialists book out. Licensed and insured.",
    },
    // Silk press (completed by amara)
    {
      jobTitle: "Silk press + trim for natural hair",
      proEmail: "amara",
      amount: 2025,
      hoursAfterJob: 4,
      status: "accepted",
      message:
        "4B/4C silk presses are my week-in-week-out. I use a titanium iron on low pass count with two layers of heat protectant, and I'll walk you through a 2-week maintenance plan.",
    },
    {
      jobTitle: "Silk press + trim for natural hair",
      proEmail: "priya",
      amount: 2175,
      hoursAfterJob: 9,
      status: "declined",
      message:
        "Would love to take care of you — press, dusting trim, and a scalp treatment add-on included. I can come to Greenside Saturday.",
    },
    // Volume lashes (open)
    {
      jobTitle: "Volume lash extensions, full set",
      proEmail: "tiana",
      amount: 2775,
      hoursAfterJob: 4,
      status: "pending",
      message:
        "Side sleeper — say less. I use lightweight 0.05 fibers and a retention-focused isolation technique; my volume clients average 3-4 weeks. Cat-eye D-curl mapped to your eye shape at consult.",
    },
    {
      jobTitle: "Volume lash extensions, full set",
      proEmail: "jade",
      amount: 2400,
      hoursAfterJob: 12,
      status: "pending",
      message:
        "I do lash sets alongside my makeup work. Full volume, D-curl, sealed with a retention bonder. Studio in Rosebank or I can travel to Parkhurst.",
    },
    {
      jobTitle: "Volume lash extensions, full set",
      proEmail: "elena",
      amount: 2625,
      hoursAfterJob: 20,
      status: "withdrawn",
      message:
        "Lash-certified esthetician here — booking my first quote, then realized my calendar conflicts next week. Withdrawing so you get accurate bids, but free for fills later this month!",
    },
    // Skin fade (awarded to marcus)
    {
      jobTitle: "Skin fade + beard sculpt, house call",
      proEmail: "marcus",
      amount: 1350,
      hoursAfterJob: 2,
      status: "accepted",
      message:
        "7am house calls are my thing — I'm in Braamfontein by 6:45 live. Fade, beard sculpt, hot towel, out the door by 7:45. I'll text when I'm 10 min away.",
    },
    {
      jobTitle: "Skin fade + beard sculpt, house call",
      proEmail: "amara",
      amount: 1275,
      hoursAfterJob: 7,
      status: "declined",
      message:
        "I take select barbering clients — could do the fade and beard at your place, though my earliest slot is 8am.",
    },
    // Hydrafacial (open)
    {
      jobTitle: "Hydrafacial + dermaplaning session",
      proEmail: "elena",
      amount: 3075,
      hoursAfterJob: 3,
      status: "pending",
      message:
        "Hydrafacial-certified with 6 years on the device. For dehydrated skin with T-zone congestion I'd pair it with a gentle enzyme prep, then send you home with a barrier-first aftercare card.",
    },
    {
      jobTitle: "Hydrafacial + dermaplaning session",
      proEmail: "isabella",
      amount: 2850,
      hoursAfterJob: 8,
      status: "pending",
      message:
        "Combining both is great as long as we go gentle — I'd do dermaplane first, then a hydrating Hydrafacial pass. I finish every session with gua sha lymphatic work, on the house.",
    },
    // Wedding makeup (open)
    {
      jobTitle: "Wedding makeup trial + day-of",
      proEmail: "jade",
      amount: 7425,
      hoursAfterJob: 6,
      status: "pending",
      message:
        "Waterproof is my default, not an upgrade — tear-proof lash strips, setting seals, and a mini touch-up kit for your clutch. Trial at my Rosebank studio, day-of at your venue by 8:45am sharp.",
    },
    {
      jobTitle: "Wedding makeup trial + day-of",
      proEmail: "priya",
      amount: 7800,
      hoursAfterJob: 11,
      status: "pending",
      message:
        "Congrats Ava! I specialize in long-wear bridal glam (South Asian weddings run 12+ hours, so your 4pm ceremony is easy mode). Quote covers trial, day-of, and one bridesmaid touch-up each hour.",
    },
    // Acrylic removal + BIAB (open)
    {
      jobTitle: "Acrylic removal + BIAB overlay",
      proEmail: "chloe",
      amount: 1575,
      hoursAfterJob: 5,
      status: "pending",
      message:
        "BIAB is my whole philosophy — gentle e-file removal, nail rehab assessment, then a structured overlay that lets your natural nail grow under protection. Sheer nude shades on deck.",
    },
    {
      jobTitle: "Acrylic removal + BIAB overlay",
      proEmail: "sofia",
      amount: 1425,
      hoursAfterJob: 9,
      status: "pending",
      message:
        "I do soak-off + BIAB rebuilds weekly. No drilling trauma, promise. Can fit you in this week after 5pm in Fourways, or I travel within the northern suburbs for a small fee.",
    },
    // Knotless braids (awarded to amara)
    {
      jobTitle: "Knotless box braids, waist length",
      proEmail: "amara",
      amount: 4500,
      hoursAfterJob: 3,
      status: "accepted",
      message:
        "Knotless, small, waist length — about 7 hours with two break pauses. Zero tension technique for sensitive scalps (feed-in, not anchored). I'll supply the hair; photo of the exact bundle sent before I buy.",
    },
    {
      jobTitle: "Knotless box braids, waist length",
      proEmail: "priya",
      amount: 4875,
      hoursAfterJob: 8,
      status: "declined",
      message:
        "I braid occasionally alongside styling work. Could do a weekend appointment across two shorter sessions if sitting long is tough.",
    },
    // Couples massage (completed by maya)
    {
      jobTitle: "Couples massage for our anniversary",
      proEmail: "maya",
      amount: 4650,
      hoursAfterJob: 4,
      status: "accepted",
      message:
        "Happy anniversary in advance! I'd do both 60-min sessions back-to-back (or coordinate a second therapist for simultaneous). Candle setup and a playlist included at no charge.",
    },
    {
      jobTitle: "Couples massage for our anniversary",
      proEmail: "isabella",
      amount: 4425,
      hoursAfterJob: 9,
      status: "declined",
      message:
        "I can bring calming energy and a table to Parktown North — back-to-back 60s with a 10-minute reset between. Add aromatherapy if you'd like.",
    },
    // Microblading touch-up (open)
    {
      jobTitle: "Microblading touch-up (6-month)",
      proEmail: "tiana",
      amount: 3375,
      hoursAfterJob: 5,
      status: "pending",
      message:
        "Working over existing pigment is fine as long as it's faded ~50% — I'll judge from your photos first. Touch-up includes mapping check, color refresh, and a 6-week perfecting session.",
    },
    {
      jobTitle: "Microblading touch-up (6-month)",
      proEmail: "elena",
      amount: 3600,
      hoursAfterJob: 26,
      status: "pending",
      message:
        "Licensed PMU artist. If the old pigment has warm undertones I'll neutralize before refreshing, so results-age clean. Consult photos welcome.",
    },
    // Monthly facial (cancelled job — bids left hanging)
    {
      jobTitle: "Monthly facial membership trial",
      proEmail: "elena",
      amount: 2175,
      hoursAfterJob: 6,
      status: "pending",
      message:
        "Love this idea — I have a few monthly clients on a flat rate. We'd rotate hydrating, clarifying, and lifting facials seasonally.",
    },
    {
      jobTitle: "Monthly facial membership trial",
      proEmail: "isabella",
      amount: 1950,
      hoursAfterJob: 15,
      status: "pending",
      message:
        "Flat monthly works for me — 60-min custom facial each visit, first one discounted so you can test the fit.",
    },
    // Kids haircuts (open)
    {
      jobTitle: "Haircuts for my two boys (5 and 8)",
      proEmail: "marcus",
      amount: 1125,
      hoursAfterJob: 2,
      status: "pending",
      message:
        "Dad of three — wiggly kids are my specialty. Taper for the big one, clean-up for the little guy, both done in about 45 minutes at your place. Saturday 9am works.",
    },
    {
      jobTitle: "Haircuts for my two boys (5 and 8)",
      proEmail: "amara",
      amount: 1275,
      hoursAfterJob: 7,
      status: "pending",
      message:
        "I do kids' cuts at home with cartoons-friendly patience. Both boys in one visit, and I'll clean up the space after — no hair left behind.",
    },
  ];

  const bidValues = bidSeeds.map((b) => {
    const job = jobByTitle[b.jobTitle];
    const pro = proByEmail[b.proEmail];
    return {
      jobId: job.id,
      proId: pro.id,
      amount: b.amount,
      message: b.message,
      status: b.status,
      createdAt: new Date(job.createdAt.getTime() + b.hoursAfterJob * HOUR),
      updatedAt: new Date(job.createdAt.getTime() + (b.hoursAfterJob + 1) * HOUR),
    };
  });

  const insertedBids = await db.insert(bids).values(bidValues).returning();

  // Wire awarded jobs to their accepted bids
  const { eq } = await import("drizzle-orm");
  for (const job of insertedJobs) {
    if (job.status === "awarded" || job.status === "completed") {
      const accepted = insertedBids.find(
        (b) => b.jobId === job.id && b.status === "accepted",
      );
      if (accepted) {
        await db
          .update(jobs)
          .set({ awardedBidId: accepted.id })
          .where(eq(jobs.id, job.id));
      }
    }
  }

  const jobCount = insertedJobs.length;
  const bidCount = insertedBids.length;
  console.log(
    `Seeded ${18} users, ${jobCount} jobs, ${bidCount} bids. Demo login: ava@glossdemo.com / amara@glossdemo.com — password: demo1234`,
  );

  // Sanity: print latest job titles
  const latest = await db
    .select({ title: jobs.title, status: jobs.status })
    .from(jobs)
    .orderBy(desc(jobs.createdAt))
    .limit(3);
  console.log("Latest jobs:", latest.map((j) => `${j.title} [${j.status}]`).join(", "));

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
