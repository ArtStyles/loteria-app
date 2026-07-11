export async function withMinimumDelay(work, minimumMs = 800) {
  const [result] = await Promise.all([
    work,
    new Promise((resolve) => setTimeout(resolve, minimumMs)),
  ]);

  return result;
}
