import { defineTool } from '@/core/types';

export default defineTool({
  id: 'js-benchmark',
  path: 'code/js-benchmark',
  name: 'JS Benchmark Builder',
  description: 'Turn code snippets into a ready-to-run script that compares their speed in operations per second',
  category: 'code',
  audience: 'developer',
  priority: 'P2',
  aliases: ['benchmark', 'jsperf', 'performance test', 'microbenchmark', 'compare code speed', 'ops per second'],
  related: ['js-format', 'js-minify', 'chmod-calc'],
  inputKind: 'text',
  example: {
    input: '// setup\nconst arr = Array.from({ length: 1000 }, (_, i) => i);\n// ---\n// name: for loop\nlet s = 0;\nfor (let i = 0; i < arr.length; i++) s += arr[i];\n// ---\n// name: reduce\narr.reduce((a, b) => a + b, 0)',
    expect: 'ops/sec',
  },
  restrictions: [{ message: 'This Tool only writes the benchmark script; it does not run your code. Run the script yourself in a browser console or with node.' }],
  load: () => import('./Tool'),
  steps: () => import('./logic').then((m) => [{ id: 'js-benchmark:build', label: 'Code: build JS benchmark script', run: (s: string) => m.buildBenchmark(s) }]),
});
