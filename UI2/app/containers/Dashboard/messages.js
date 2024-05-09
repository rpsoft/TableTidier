/*
 * Dashboard Messages
 *
 * This contains all the text for the Dashboard container.
 */

import { defineMessages } from 'react-intl';

export const scope = 'app.containers.Dashboard';

export default defineMessages({
  header: {
    id: `${scope}.header`,
    defaultMessage: 'This is the Dashboard container!',
  },
});
