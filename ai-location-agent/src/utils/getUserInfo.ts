import axios from 'axios';

import { logger } from './logger';

const getUserInfo = async (token: string): Promise<{ user_id: number; user_name: string }> => {
  try {
    const { data } = await axios.get(`${process.env.ADMIN_BE}/api/1.0/auth/check`, {
      headers: { Authorization: token },
    });

    return data;
  } catch (error) {
    logger.error(
      `[ERROR] [getUserInfo] ${
        axios.isAxiosError(error)
          ? JSON.stringify(error.response?.data || error)
          : error instanceof Error
            ? error.message
            : error
      }`,
    );
    throw axios.isAxiosError(error) ? 'User not authorized' : error;
  }
};

export default getUserInfo;
