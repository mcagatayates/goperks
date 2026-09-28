export type PlaceType = "restaurant" | "cafe" | "both";

export type DistanceKey = "near" | "mid" | "far";

export interface DistanceOption {
  key: DistanceKey;
  label: string;
  helper: string;
  radiusMeters: number;
}

export interface CuisineOption {
  key: string;
  label: string;
  emoji: string;
  /** substrings matched against OSM `cuisine` tag tokens */
  match: string[];
}

export interface RawPlace {
  id: string;
  name: string;
  lat: number;
  lon: number;
  amenity: string;
  cuisineTags: string[];
  address?: string;
  openingHours?: string;
  website?: string;
  phone?: string;
}

export interface ScoredPlace extends RawPlace {
  distanceMeters: number;
  score: number;
  matchedCuisine: boolean;
}

export interface SearchCriteria {
  lat: number;
  lon: number;
  placeType: PlaceType;
  cuisineKeys: string[];
  distance: DistanceKey;
}
