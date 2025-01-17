export async function text_generation_operation(api_url, queryOptions, headers) {
  const { model, input, operation_parameters } = queryOptions;
  const response = await fetch(`${api_url}${model}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      inputs: input,
      ...(operation_parameters ? { parameters: JSON.parse(operation_parameters) } : {}),
    }),
  });
  if (!response.ok) {
    throw new Error('Text generation operation failed');
  }
  return await response.json();
}

export async function summarisation_operation(api_url, queryOptions, headers) {
  const { model, input, operation_parameters } = queryOptions;
  const response = await fetch(`${api_url}${model}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      inputs: input,
      ...(operation_parameters ? { parameters: JSON.parse(operation_parameters) } : {}),
    }),
  });
  if (!response.ok) {
    throw new Error('Text generation operation failed');
  }
  return await response.json();
}
