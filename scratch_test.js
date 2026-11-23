const { default: fetch } = await import('node-fetch').catch(() => ({ default: globalThis.fetch }));
console.log('Testing...');
