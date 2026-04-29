import { SetMetadata } from '@nestjs/common';

export const APPLICATION_STATUS_ACCESS_KEY = 'application_status_access';

export interface ApplicationStatusAccessOptions {
  allowSameStatus?: boolean;
}

export const ApplicationStatusAccess = (
  options: ApplicationStatusAccessOptions = {},
) => SetMetadata(APPLICATION_STATUS_ACCESS_KEY, options);
