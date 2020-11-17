/*
 * PopAlert Messages
 *
 * This contains all the text for the PopAlert component.
 */

import { defineMessages } from 'react-intl';

export const scope = 'app.components.PopAlert';

export default defineMessages({
  header: {
    id: `${scope}.header`,
    defaultMessage: 'This is the PopAlert component!',
  },
});
