import { BigQuery } from '@google-cloud/bigquery';

export async function listDatasets(client: BigQuery, _options: object): Promise<object> {

  const [datasets] = await client.getDatasets();
  return { datasets };
}


export async function queryBQ(client: BigQuery, _options: object): Promise<object> {

  const query = _options['query'];

  const options = {
    query: query
  };

  // Run the query as a job
  const [job] = await client.createQueryJob(options);
  console.log(`Job ${job.id} started.`);

  // Wait for the query to finish
  const [rows] = await job.getQueryResults();

  return { rows };
}
