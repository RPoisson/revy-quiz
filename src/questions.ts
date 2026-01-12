// src/questions.ts (or wherever "@/questions" points)
// FCH aesthetic questions

import { shouldShowSpace, isArchetypeSupported } from "@/app/quiz/logic";

export type QuestionType = "multi-image" | "single-image";
export type QuestionLayout = "stack" | "grid";

type Answers = Record<string, string[]>;

export interface Option {
  id: string;
  label: string;
  subtitle?: string;
  imageUrl?: string;

  // for conditional options (Step 3)
  showIf?: (answers: Answers) => boolean;

  // NEW (optional): allow showing options that are visible but not selectable
  // (e.g., “Not the best fit for this project” with a why)
  disabledIf?: (answers: Answers) => boolean;
  disabledReason?: (answers: Answers) => string;
}

export interface Question {
  id: string;
  title: string;
  subtitle?: string;
  type: QuestionType;
  options: Option[];
  allowMultiple: boolean;

  // UI control
  layout?: QuestionLayout;

  // conditional display (Step 3 - future)
  showIf?: (answers: Answers) => boolean;

  // required gating
  required?: boolean;
}

// ──────────────────────────────────────────────────────────────
// Color mood gating helpers
// ──────────────────────────────────────────────────────────────

type Archetype = "parisian" | "provincial" | "mediterranean" | "unknown";

function selectedArchetypeFromAnswers(answers: Answers): Archetype {
  // Q3: space_home determines the archetype direction
  const selected = (answers["space_home"] ?? [])[0];
  if (selected === "home_01") return "parisian";
  if (selected === "home_02") return "provincial";
  if (selected === "home_03") return "mediterranean";
  return "unknown";
}

function exteriorFamilyFromAnswers(answers: Answers): "sunwashed" | "modern" | "heritage" | "classic" {
  const ext = ((answers["home_exterior_style"] ?? [])[0] ?? "").toLowerCase();

  if (["mediterranean_spanish", "ranch"].includes(ext)) return "sunwashed";
  if (["contemporary_modern", "midcentury_modern"].includes(ext)) return "modern";
  if (["victorian", "tudor_english_cottage", "craftsman"].includes(ext)) return "heritage";
  return "classic"; // cape_cod, colonial, french_provincial, modern_farmhouse, etc.
}

type PaletteId = "mood-01" | "mood-02" | "mood-03" | "mood-04" | "mood-05";

function supportedPalettesByArchetype(archetype: Archetype): Set<PaletteId> {
  // ✅ Archetype is the driver of supported palettes
  switch (archetype) {
    case "parisian":
      return new Set<PaletteId>(["mood-01", "mood-02", "mood-03", "mood-04"]); // 1–4
    case "provincial":
      return new Set<PaletteId>(["mood-01", "mood-02", "mood-04"]); // 1,2,4
    case "mediterranean":
      return new Set<PaletteId>(["mood-01", "mood-03", "mood-05"]); // 1,3,5 (Airy & Bright Naturals)
    default:
      // If somehow archetype isn’t determined yet, don’t block selection.
      return new Set<PaletteId>(["mood-01", "mood-02", "mood-03", "mood-04", "mood-05"]);
  }
}

function isPaletteDisallowedByExterior(paletteId: PaletteId, answers: Answers): boolean {
  const fam = exteriorFamilyFromAnswers(answers);

  // Removal-only constraint layer. Keep V1 conservative.
  // Sun-washed shells: sharp contrast + heavy drama often fight the architecture.
  if (fam === "sunwashed") {
    if (paletteId === "mood-02") return true; // high contrast
    if (paletteId === "mood-04") return true; // dramatic & moody
  }

  return false;
}

function isPaletteSelectable(paletteId: PaletteId, answers: Answers): boolean {
  const archetype = selectedArchetypeFromAnswers(answers);
  const supported = supportedPalettesByArchetype(archetype).has(paletteId);
  if (!supported) return false;
  if (isPaletteDisallowedByExterior(paletteId, answers)) return false;
  return true;
}

function notBestFitReason(paletteId: PaletteId, answers: Answers): string {
  const archetype = selectedArchetypeFromAnswers(answers);
  const fam = exteriorFamilyFromAnswers(answers);

  // Exterior-driven reasons (strongest)
  if (fam === "sunwashed") {
    if (paletteId === "mood-02") {
      return "High contrast can read too sharp against a sun-washed exterior—this project will feel more cohesive with softer transitions.";
    }
    if (paletteId === "mood-04") {
      return "A very moody palette can feel heavy in a sun-washed architectural context—this direction typically wants light-driven warmth.";
    }
  }

  // Archetype-driven reasons
  if (archetype === "provincial" && paletteId === "mood-03") {
    return "Deep jewel tones tend to feel too intense for this direction—depth reads better through atmosphere and natural materials.";
  }

  if (archetype === "mediterranean" && paletteId === "mood-02") {
    return "High contrast usually fights the warm, mineral feel that suits this project best.";
  }

  if (archetype === "mediterranean" && paletteId === "mood-04") {
    return "This direction is meant to feel airy and sun-softened—dramatic darkness is less likely to feel natural here.";
  }

  if (archetype === "parisian" && paletteId === "mood-05") {
    return "Airy & Bright Naturals is designed for Mediterranean projects—this project direction typically reads more tailored than sun-washed.";
  }

  if (archetype === "provincial" && paletteId === "mood-05") {
    return "This palette reads more coastal and sun-washed than grounded—less aligned with the overall direction of this project.";
  }

  // Fallback
  return "Not the strongest fit for the home’s exterior character and the overall direction of this project.";
}

export const QUESTIONS: Question[] = [
  // Q1 – Exterior / architectural style
  {
    id: "home_exterior_style",
    title: "What is the exterior / architectural style of the home?",
    subtitle: "Choose the closest match.",
    type: "single-image",
    allowMultiple: false,
    layout: "grid",
    required: true,
    options: [
      { id: "cape_cod", label: "Cape Cod", imageUrl: "/quiz/exterior/CapeCod.jpg" },
      { id: "colonial", label: "Colonial", imageUrl: "/quiz/exterior/Colonial.jpg" },
      { id: "contemporary_modern", label: "Contemporary Modern", imageUrl: "/quiz/exterior/ContemporaryModern.jpg" },
      { id: "craftsman", label: "Craftsman", imageUrl: "/quiz/exterior/Craftsman.jpg" },
      { id: "french_provincial", label: "French Provincial", imageUrl: "/quiz/exterior/FrenchProvincial.jpg" },
      { id: "mediterranean_spanish", label: "Mediterranean / Spanish", imageUrl: "/quiz/exterior/MediterraneanSpanish.jpg" },
      { id: "midcentury_modern", label: "Mid-Century Modern", imageUrl: "/quiz/exterior/MidCenturyModern.jpg" },
      { id: "modern_farmhouse", label: "Modern Farmhouse", imageUrl: "/quiz/exterior/ModernFarmhouse.jpg" },
      { id: "ranch", label: "Ranch", imageUrl: "/quiz/exterior/Ranch.jpg" },
      { id: "tudor_english_cottage", label: "Tudor / English Cottage", imageUrl: "/quiz/exterior/Tudor.jpg" },

      // If the image doesn't render, rename to Victorian.jpg and update this path.
      { id: "victorian", label: "Victorian", imageUrl: "/quiz/exterior/Victorian.jpg" },
    ],
  },

  // Q2 – Spaces that appeal (27-image multi-select, filtered by supported archetypes)
  {
    id: "spaces_appeal",
    title: "Which of these spaces appeal to you?",
    subtitle: "Select as many as you like. Scroll to see more.",
    type: "multi-image",
    allowMultiple: true,
    layout: "grid",
    options: Array.from({ length: 27 }).map((_, i) => {
      const index = i + 1;
      const id = `space_${String(index).padStart(2, "0")}`;
      return {
        id,
        label: `Space ${index}`,
        imageUrl: `/quiz/q1/${id}.jpg`,
        showIf: (answers) => shouldShowSpace(id, answers),
      };
    }),
  },

  // Q3 – Space that feels like home
  {
    id: "space_home",
    title: "Which of these do you prefer?",
    subtitle: "Choose the style that feels best suited for your project.",
    type: "single-image",
    allowMultiple: false,
    options: [
      {
        id: "home_01",
        label: "Refined & Elegant",
        imageUrl: "/quiz/q2/home_01.jpg",
        showIf: (answers) => isArchetypeSupported(answers, "parisian"),
      },
      {
        id: "home_02",
        label: "Cozy & Lived-in",
        imageUrl: "/quiz/q2/home_02.jpg",
        showIf: (answers) => isArchetypeSupported(answers, "provincial"),
      },
      {
        id: "home_03",
        label: "Sun-kissed & Relaxed",
        imageUrl: "/quiz/q2/home_03.jpg",
        showIf: (answers) => isArchetypeSupported(answers, "mediterranean"),
      },
    ],
  },

  // Q4 – Light & color balance
  {
    id: "light_color",
    title: "What kind of light and color balance do you prefer?",
    subtitle: "Think about what inspires you or feels most right for this project.",
    type: "single-image",
    allowMultiple: false,
    options: [
      { id: "light_01", label: "Bright & Airy", imageUrl: "/quiz/q3/light-01.jpg" },
      { id: "light_02", label: "Balanced with Contrast", imageUrl: "/quiz/q3/light-02.jpg" },
      { id: "light_03", label: "Moody & Dramatic", imageUrl: "/quiz/q3/light-03.jpg" },
    ],
  },

  // Q5 – Material palette
  {
    id: "material_palette",
    title: "What materials and textures do you prefer?",
    subtitle: "Choose the mix that feels most right.",
    type: "single-image",
    allowMultiple: false,
    options: [
      { id: "material-01", label: "Polished & Modern", imageUrl: "/quiz/q5/material-01.jpg" },
      { id: "material-02", label: "Crisp & Natural", imageUrl: "/quiz/q5/material-02.jpg" },
      { id: "material-03", label: "Textured & Vintage", imageUrl: "/quiz/q5/material-03.jpg" },
    ],
  },

  // Q6 – How space should feel
  {
    id: "space_feel",
    title: "How should a space feel?",
    subtitle: "Follow your instinct.",
    type: "single-image",
    allowMultiple: false,
    options: [
      { id: "feel-01", label: "Minimal", imageUrl: "/quiz/q6/feel-01.jpg" },
      { id: "feel-02", label: "Curated", imageUrl: "/quiz/q6/feel-02.jpg" },
      { id: "feel-03", label: "Layered", imageUrl: "/quiz/q6/feel-03.jpg" },
    ],
  },

  // Q7 – Color mood (with supported vs not-best-fit behavior)
  {
    id: "color_mood",
    title: "What’s your ideal color mood?",
    subtitle:
      "Choose the palette that feels most right for this project. Some options may not be the best fit for the home’s exterior character and the overall taste direction we've determined so far.",
    type: "single-image",
    allowMultiple: false,
    options: [
      {
        id: "mood-01",
        label: "Soft Neutrals & Warm Whites",
        imageUrl: "/quiz/q8/mood-01.jpg",
        showIf: () => true,
        disabledIf: (answers) => !isPaletteSelectable("mood-01", answers),
        disabledReason: (answers) => notBestFitReason("mood-01", answers),
      },
      {
        id: "mood-02",
        label: "Neutral with High Contrast",
        imageUrl: "/quiz/q8/mood-02.jpg",
        showIf: () => true,
        disabledIf: (answers) => !isPaletteSelectable("mood-02", answers),
        disabledReason: (answers) => notBestFitReason("mood-02", answers),
      },
      {
        id: "mood-03",
        label: "Deep Jewel Tones",
        imageUrl: "/quiz/q8/mood-03.jpg",
        showIf: () => true,
        disabledIf: (answers) => !isPaletteSelectable("mood-03", answers),
        disabledReason: (answers) => notBestFitReason("mood-03", answers),
      },
      {
        id: "mood-04",
        label: "Dramatic & Moody",
        imageUrl: "/quiz/q8/mood-04.jpg",
        showIf: () => true,
        disabledIf: (answers) => !isPaletteSelectable("mood-04", answers),
        disabledReason: (answers) => notBestFitReason("mood-04", answers),
      },
      {
        id: "mood-05",
        label: "Airy & Bright Naturals",
        imageUrl: "/quiz/q8/mood-05.jpg",
        showIf: () => true,
        disabledIf: (answers) => !isPaletteSelectable("mood-05", answers),
        disabledReason: (answers) => notBestFitReason("mood-05", answers),
      },
    ],
  },
];
