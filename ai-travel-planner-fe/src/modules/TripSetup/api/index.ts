export type {
  DestinationClarificationOption,
  DestinationValidationResult,
  TravelSetupGenerateResult,
  TripSetupPlanPayload,
  ValidateDestinationRequestBody,
} from "@/modules/TripSetup/model/tripSetup.interface"
export { validateDestinationRequest } from "@/modules/TripSetup/api/validation"
export {
  fetchDestinationInterests,
  generateTravelSetupPlan,
} from "@/modules/TripSetup/api/travelPlanner.api"
