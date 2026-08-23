---
to: <%= name %>/tsconfig.json
---
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["dom", "dom.iterable", "esnext"],
    "skipLibCheck": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "noEmit": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "jsx": "react-jsx",
  },
  "include": ["**/*.tsx", "**/*.ts"]
}
