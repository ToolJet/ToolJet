import { getEditionSpecificHelper } from './getEditionSpecificHelper';
let hubspotHelper;
try {
    hubspotHelper = await getEditionSpecificHelper('hubspot');
} catch (error) {
    console.error('Failed to load hubspot helper:', error);
}
export default hubspotHelper;
