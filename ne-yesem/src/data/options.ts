import type { CuisineOption, DistanceOption } from "../types";

export const CUISINES: CuisineOption[] = [
  { key: "any", label: "Fark Etmez", emoji: "🎲", match: [] },
  {
    key: "turkish",
    label: "Türk Mutfağı",
    emoji: "🥙",
    match: ["turkish", "kebab", "kebap", "doner", "döner", "pide", "lahmacun"],
  },
  {
    key: "fastfood",
    label: "Fast Food",
    emoji: "🍔",
    match: ["burger", "fast_food", "pizza", "sandwich", "chicken", "friture"],
  },
  {
    key: "cafe",
    label: "Kahve & Tatlı",
    emoji: "☕",
    match: ["coffee_shop", "cafe", "dessert", "cake", "ice_cream", "bubble_tea", "pastry"],
  },
  {
    key: "italian",
    label: "İtalyan",
    emoji: "🍝",
    match: ["italian", "pizza", "pasta"],
  },
  {
    key: "asian",
    label: "Uzak Doğu",
    emoji: "🍜",
    match: ["asian", "chinese", "japanese", "sushi", "thai", "korean", "vietnamese", "noodle"],
  },
  {
    key: "seafood",
    label: "Deniz Ürünleri",
    emoji: "🐟",
    match: ["seafood", "fish"],
  },
  {
    key: "vegetarian",
    label: "Vejetaryen",
    emoji: "🥗",
    match: ["vegetarian", "vegan", "salad"],
  },
];

export const DISTANCES: DistanceOption[] = [
  { key: "near", label: "Yakın", helper: "~1 km", radiusMeters: 1000 },
  { key: "mid", label: "Orta", helper: "~3 km", radiusMeters: 3000 },
  { key: "far", label: "Uzak", helper: "~7 km", radiusMeters: 7000 },
];

export const LOADING_MESSAGES = [
  "Civardaki mekanlara bakıyoruz…",
  "En lezzetli 3 seçeneği topluyoruz…",
  "Menüleri kokluyoruz…",
  "Mideni mutlu edecek yerleri arıyoruz…",
];
