import { assertAiTestDatabase } from './helpers/ai-test-database';

export default function setup() {
  assertAiTestDatabase(process.env.ATTACHMENT_TEST_DATABASE_URL);
}
