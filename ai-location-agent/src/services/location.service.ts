import { LocationBodyDto } from '../dtos/location.dto';
import { logger } from '../utils/logger';

class LocationService {
  public async getLocation(body: LocationBodyDto): Promise<null> {
    try {
      let targetLocations = [];
      let targetLocationsCount = 0;

      // Defining target locations count

      // Expanding categories with OpenAI API

      // 

      return null;
    } catch (error) {
      logger.error(
        `[LocationService] getLocation: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
}

export default LocationService;
