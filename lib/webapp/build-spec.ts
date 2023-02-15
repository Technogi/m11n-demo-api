export const buildSpec = {
  version: "1.0",
  applications: [
    {
      frontend: {
        phases: {
          preBuild: {
            commands: [
              // Install the correct Node version, defined in .nvmrc
              "nvm install",
              "nvm use",
              // Install pnpm
              //'corepack enable',
              //'corepack prepare pnpm@latest --activate',
              // Avoid memory issues with node
              "export NODE_OPTIONS=--max-old-space-size=8192",
              // Ensure node_modules are correctly included in the build artifacts
              "npm install",
            ],
          },
          build: {
            commands: [
              // Allow Next.js to access environment variables
              // See https://docs.aws.amazon.com/amplify/latest/userguide/ssr-environment-variables.html
              //`env | grep -E '${Object.keys(environmentVariables).join('|')}' >> .env.production`,
              // Build Next.js app
              //'pnpm next build --no-lint',
              "npm run build",
            ],
          },
        },
        artifacts: {
          baseDirectory: ".next",
          files: ["**/*"],
        },
      },
    },
  ],
};
