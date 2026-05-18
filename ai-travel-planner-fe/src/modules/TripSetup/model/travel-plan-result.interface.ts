/** Final itinerary JSON from the itinerary agent (matches TRAVEL_PLAN_GENERATE_PROMPT schema). */

export interface TravelPlanActivityPoi {
  name: string
  placeId: string
}

export interface TravelPlanActivity {
  startTime: string
  endTime: string
  type: string
  title: string
  description: string
  poi: TravelPlanActivityPoi
  reasoning: string
  tips: string[]
}

export interface TravelPlanDayWeather {
  summary: string
  temperatureMin: number
  temperatureMax: number
  precipitationMm: number
}

export interface TravelPlanFoodRec {
  type: "breakfast" | "lunch" | "dinner" | "drinks"
  name: string
  reasoning: string
}

export interface TravelPlanBackupOption {
  condition: string
  alternative: string
}

export interface TravelPlanDay {
  date: string
  dayNumber: number
  weather: TravelPlanDayWeather
  area: string
  pace: "light" | "moderate" | "active"
  activities: TravelPlanActivity[]
  foodRecommendations: TravelPlanFoodRec[]
  backupOptions: TravelPlanBackupOption[]
  dailyNotes: string[]
}

export interface TravelPlanJson {
  destination: string
  summary: {
    tripStyle: string
    weatherOverview: string
    planningLogic: string
  }
  days: TravelPlanDay[]
}

export interface TravelPlanGenerateAcceptedResponse {
  ok: true
  jobId: string
}

export type ItineraryWsEvent =
  | { type: "plan_done"; jobId: string; plan: TravelPlanJson }
  | { type: "plan_error"; jobId: string; error: string }
